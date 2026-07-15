// ═══════════════════════════════════════════════════════════════
// Authentication Database Repository
// Direct database access layer for user authentication and session tables
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { User, Session, VerificationToken } from '@prisma/client';
import { VerificationTokenType } from '@nexastore/shared';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async createUser(data: any): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async updateUser(id: string, data: any): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async createSession(data: {
    userId: string;
    token: string;
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): Promise<Session> {
    return prisma.session.create({
      data,
    });
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: { token, isValid: true },
    });
  }

  async findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: { refreshToken, isValid: true },
    });
  }

  async deleteSession(id: string): Promise<void> {
    await prisma.session.delete({ where: { id } });
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  }

  async invalidateSession(id: string): Promise<void> {
    await prisma.session.update({
      where: { id },
      data: { isValid: false },
    });
  }

  async createVerificationToken(data: {
    email: string;
    token: string;
    otp?: string;
    type: VerificationTokenType;
    expiresAt: Date;
  }): Promise<VerificationToken> {
    return prisma.verificationToken.create({
      data: data as any,
    });
  }

  async findVerificationToken(token: string, type?: VerificationTokenType): Promise<VerificationToken | null> {
    return prisma.verificationToken.findFirst({
      where: { token, type: type as any },
    });
  }

  async findVerificationTokenByEmailAndOtp(email: string, otp: string, type: VerificationTokenType): Promise<VerificationToken | null> {
    return prisma.verificationToken.findFirst({
      where: { email, otp, type: type as any },
    });
  }

  async deleteVerificationToken(id: string): Promise<void> {
    await prisma.verificationToken.delete({ where: { id } });
  }

  async deleteExpiredTokens(): Promise<void> {
    await prisma.verificationToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  async findUserByProviderId(provider: 'GOOGLE' | 'GITHUB', providerId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { provider: provider as any, providerId, deletedAt: null },
    });
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: { userId, isValid: true, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
