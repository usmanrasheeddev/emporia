// ═══════════════════════════════════════════════════════════════
// Authentication Controller Layer
// Handles incoming HTTP requests and structures standardized API responses
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { getClientIp, parseUserAgent } from '../../utils/helpers';
import { RequestWithUser } from '../../types';

const repository = new AuthRepository();
const authService = new AuthService(repository);

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await authService.register(req.body);
    res.status(201).json(ApiResponse.success('User registered successfully. Please verify your email.', data, 201));
  });

  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ipAddress = getClientIp(req);
    const userAgent = parseUserAgent(req);
    const result = await authService.login(req.body, ipAddress, userAgent);
    res.status(200).json(ApiResponse.success('Login successful', result));
  });

  static verifyTwoFactor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ipAddress = getClientIp(req);
    const userAgent = parseUserAgent(req);
    const { userId, token, code } = req.body;
    const result = await authService.verifyTwoFactor(userId, token, code, ipAddress, userAgent);
    res.status(200).json(ApiResponse.success('Login successful', result));
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    res.status(200).json(ApiResponse.success('Token refreshed successfully', tokens));
  });

  static logout = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization!;
    const token = authHeader.split(' ')[1];
    await authService.logout(req.sessionId!, req.user!.id, token);
    res.status(200).json(ApiResponse.success('Logged out successfully'));
  });

  static logoutAll = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    await authService.logoutAll(req.user!.id);
    res.status(200).json(ApiResponse.success('Logged out from all devices successfully'));
  });

  static verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    await authService.verifyEmail(token);
    res.status(200).json(ApiResponse.success('Email verified successfully'));
  });

  static forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json(ApiResponse.success('If email exists, a password reset link has been sent'));
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json(ApiResponse.success('Password reset successfully'));
  });

  static verifyOTP = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body;
    const resetToken = await authService.verifyOTP(email, otp);
    res.status(200).json(ApiResponse.success('OTP verified successfully', { token: resetToken }));
  });

  static setupTwoFactor = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const result = await authService.setupTwoFactor(req.user!.id);
    res.status(200).json(ApiResponse.success('Two-factor authentication initiated', result));
  });

  static enableTwoFactor = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const { code } = req.body;
    await authService.enableTwoFactor(req.user!.id, code);
    res.status(200).json(ApiResponse.success('Two-factor authentication enabled successfully'));
  });

  static disableTwoFactor = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const { code } = req.body;
    await authService.disableTwoFactor(req.user!.id, code);
    res.status(200).json(ApiResponse.success('Two-factor authentication disabled successfully'));
  });

  static getSessions = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const sessions = await authService.getSessions(req.user!.id);
    res.status(200).json(ApiResponse.success('Active sessions retrieved', sessions));
  });

  static revokeSession = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await authService.revokeSession(req.user!.id, id);
    res.status(200).json(ApiResponse.success('Session revoked successfully'));
  });

  static me = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    res.status(200).json(ApiResponse.success('Current user profile retrieved', { user: req.user }));
  });

  static oauthCallback = asyncHandler(async (req: any, res: Response): Promise<void> => {
    if (!req.user) {
      res.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
      return;
    }

    const ipAddress = getClientIp(req);
    const userAgent = parseUserAgent(req);

    const result = await authService.createOAuthSession(req.user.id, ipAddress, userAgent);

    res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?token=${result.tokens.accessToken}&refreshToken=${result.tokens.refreshToken}`
    );
  });
}
