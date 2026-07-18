// ═══════════════════════════════════════════════════════════════
// Authentication Service Layer
// Orchestrates authentication workflows, security checks, and token generation
// ═══════════════════════════════════════════════════════════════

import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput, OAuthProfile } from './auth.types';
import { ApiError } from '../../utils/api-error';
import { hashPassword, comparePassword } from '../../utils/hash';
import { generateOTP, generateOTPExpiry, isOTPExpired } from '../../utils/otp';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateTokenId } from '../../utils/token';
import { sendEmail } from '../../config/mailer';
import { addToBlacklist } from '../../config/redis';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { VerificationTokenType, AuthTokens, AuthResponse, UserRole } from '@nexastore/shared';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export class AuthService {
  private repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  async register(input: RegisterInput): Promise<any> {
    const existing = await this.repository.findUserByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('A user with this email address already exists');
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await this.repository.createUser({
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: 'CUSTOMER',
    });

    // Create default wallet
    const { prisma } = require('../../config/database');
    await prisma.wallet.create({
      data: { userId: user.id, balance: 0 },
    });

    // Create default wishlist
    await prisma.wishlist.create({
      data: { userId: user.id, name: 'My Wishlist', isDefault: true },
    });

    // Generate Verification Token (as OTP)
    const token = generateTokenId();
    const otp = generateOTP();
    const expiresAt = generateOTPExpiry();

    await this.repository.createVerificationToken({
      email: user.email,
      token,
      otp,
      type: VerificationTokenType.EMAIL_VERIFY,
      expiresAt,
    });

    // Send Welcome & Verification Email
    const appUrl = env.NEXT_PUBLIC_APP_URL;
    await sendEmail({
      to: user.email,
      subject: 'Welcome to NexaStore! Verify your email',
      template: 'welcome',
      data: {
        name: user.firstName,
        verificationUrl: `${appUrl}/verify-email?token=${token}`,
        appUrl,
      },
    });

    logger.info(`User registered successfully: ${user.id}`);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async login(input: LoginInput, ipAddress?: string, userAgent?: string): Promise<any> {
    const user = await this.repository.findUserByEmail(input.email);
    if (!user || !user.password) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.isBanned) {
      throw ApiError.unauthorized('Your account has been banned');
    }

    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if email verified
    if (!user.isVerified) {
      throw ApiError.unauthorized('Please verify your email address before logging in');
    }

    // Handle 2FA check
    if (user.twoFactorEnabled) {
      // Return 2FA required response (requires second step)
      const verificationToken = generateTokenId();
      await this.repository.createVerificationToken({
        email: user.email,
        token: verificationToken,
        type: VerificationTokenType.TWO_FACTOR,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
      });

      return {
        twoFactorRequired: true,
        userId: user.id,
        token: verificationToken,
      };
    }

    // Update lastLoginAt
    await this.repository.updateUser(user.id, { lastLoginAt: new Date() });

    // Generate tokens & session
    const sessionId = generateTokenId();
    const payload = { userId: user.id, role: user.role, sessionId };

    const accessToken = generateAccessToken(payload);
    const jti = generateTokenId();
    const refreshToken = generateRefreshToken({ ...payload, jti });

    // Calculate expiry (remember me sets longer expiry, handled by system configuration or logic)
    const refreshExpiryDays = input.rememberMe ? 30 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

    await this.repository.createSession({
      userId: user.id,
      token: sessionId,
      refreshToken: jti,
      ipAddress,
      userAgent,
      expiresAt,
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
    };

    return {
      user: userProfile,
      tokens: { accessToken, refreshToken },
    };
  }

  async createOAuthSession(userId: string, ipAddress?: string, userAgent?: string): Promise<any> {
    const user = await this.repository.findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');

    await this.repository.updateUser(user.id, { lastLoginAt: new Date() });

    const sessionId = generateTokenId();
    const payload = { userId: user.id, role: user.role, sessionId };

    const accessToken = generateAccessToken(payload);
    const jti = generateTokenId();
    const refreshToken = generateRefreshToken({ ...payload, jti });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.repository.createSession({
      userId: user.id,
      token: sessionId,
      refreshToken: jti,
      ipAddress,
      userAgent,
      expiresAt,
    });

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async verifyTwoFactor(userId: string, token: string, code: string, ipAddress?: string, userAgent?: string): Promise<any> {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.twoFactorSecret) {
      throw ApiError.unauthorized('Invalid action');
    }

    // Find and validate the two-factor request verification token
    const vToken = await this.repository.findVerificationToken(token, VerificationTokenType.TWO_FACTOR);
    if (!vToken || vToken.email !== user.email || vToken.expiresAt < new Date()) {
      throw ApiError.unauthorized('Verification request expired or invalid');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });

    if (!verified) {
      throw ApiError.unauthorized('Invalid verification code');
    }

    // Clean verification token
    await this.repository.deleteVerificationToken(vToken.id);

    // Update login timestamp
    await this.repository.updateUser(user.id, { lastLoginAt: new Date() });

    const sessionId = generateTokenId();
    const payload = { userId: user.id, role: user.role, sessionId };

    const accessToken = generateAccessToken(payload);
    const jti = generateTokenId();
    const refreshToken = generateRefreshToken({ ...payload, jti });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.repository.createSession({
      userId: user.id,
      token: sessionId,
      refreshToken: jti,
      ipAddress,
      userAgent,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const decoded = verifyRefreshToken(token);

      // Find session using refreshToken JTI
      const session = await this.repository.findSessionByRefreshToken(decoded.jti);
      if (!session || !session.isValid || session.expiresAt < new Date()) {
        throw ApiError.unauthorized('Session expired or invalid');
      }

      // Generate new tokens
      const newSessionId = generateTokenId();
      const payload = { userId: decoded.userId, role: decoded.role, sessionId: newSessionId };

      const accessToken = generateAccessToken(payload);
      const newJti = generateTokenId();
      const newRefreshToken = generateRefreshToken({ ...payload, jti: newJti });

      // Rotate session: Invalidate old session, create new session
      await this.repository.invalidateSession(session.id);
      await this.repository.createSession({
        userId: decoded.userId,
        token: newSessionId,
        refreshToken: newJti,
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        expiresAt: session.expiresAt,
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
  }

  async logout(sessionId: string, userId: string, token: string): Promise<void> {
    const session = await this.repository.findSessionByToken(sessionId);
    if (session && session.userId === userId) {
      await this.repository.invalidateSession(session.id);
    }
    // Blacklist access token in Redis for remainder of expiry (15m max)
    await addToBlacklist(`blacklist:${token}`, 15 * 60);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.repository.deleteUserSessions(userId);
  }

  async verifyEmail(token: string): Promise<void> {
    const vToken = await this.repository.findVerificationToken(token, VerificationTokenType.EMAIL_VERIFY);
    if (!vToken || vToken.expiresAt < new Date()) {
      throw ApiError.badRequest('Verification link invalid or expired');
    }

    const user = await this.repository.findUserByEmail(vToken.email);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await this.repository.updateUser(user.id, { isVerified: true });
    await this.repository.deleteVerificationToken(vToken.id);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      // Silently return to prevent user enumeration attacks
      return;
    }

    const token = generateTokenId();
    const otp = generateOTP();
    const expiresAt = generateOTPExpiry();

    await this.repository.createVerificationToken({
      email: user.email,
      token,
      otp,
      type: VerificationTokenType.PASSWORD_RESET,
      expiresAt,
    });

    const appUrl = env.NEXT_PUBLIC_APP_URL;
    await sendEmail({
      to: user.email,
      subject: 'Reset Your NexaStore Password',
      template: 'password-reset',
      data: {
        otp,
        resetUrl: `${appUrl}/reset-password?token=${token}`,
        expiryMinutes: 10,
        appUrl,
      },
    });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const vToken = await this.repository.findVerificationToken(token, VerificationTokenType.PASSWORD_RESET);
    if (!vToken || vToken.expiresAt < new Date()) {
      throw ApiError.badRequest('Password reset link invalid or expired');
    }

    const user = await this.repository.findUserByEmail(vToken.email);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const hashedPassword = await hashPassword(password);
    await this.repository.updateUser(user.id, { password: hashedPassword });
    await this.repository.deleteVerificationToken(vToken.id);

    // Revoke all sessions for security
    await this.repository.deleteUserSessions(user.id);
  }

  async verifyOTP(email: string, otp: string): Promise<string> {
    const vToken = await this.repository.findVerificationTokenByEmailAndOtp(
      email,
      otp,
      VerificationTokenType.PASSWORD_RESET
    );

    if (!vToken || vToken.expiresAt < new Date()) {
      throw ApiError.badRequest('Invalid or expired OTP code');
    }

    return vToken.token;
  }

  async setupTwoFactor(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.repository.findUserById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const secret = speakeasy.generateSecret({
      name: `NexaStore:${user.email}`,
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    // Temporary store secret on user (will be finalized when verified)
    await this.repository.updateUser(user.id, {
      twoFactorSecret: secret.base32,
    });

    return { secret: secret.base32, qrCodeUrl };
  }

  async enableTwoFactor(userId: string, code: string): Promise<void> {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.twoFactorSecret) {
      throw ApiError.notFound('Verification secret missing');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });

    if (!verified) {
      throw ApiError.badRequest('Invalid verification code');
    }

    await this.repository.updateUser(user.id, {
      twoFactorEnabled: true,
    });
  }

  async disableTwoFactor(userId: string, code: string): Promise<void> {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.twoFactorSecret) {
      throw ApiError.notFound('Two factor auth is not enabled');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });

    if (!verified) {
      throw ApiError.badRequest('Invalid verification code');
    }

    await this.repository.updateUser(user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }

  async getSessions(userId: string): Promise<any[]> {
    return this.repository.getUserSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.repository.findSessionByToken(sessionId);
    if (!session || session.userId !== userId) {
      throw ApiError.notFound('Session not found');
    }
    await this.repository.invalidateSession(session.id);
  }
}
