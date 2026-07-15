// ═══════════════════════════════════════════════════════════════
// User Service Layer
// Orchestrates account management, settings, addresses, and admin dashboards
// ═══════════════════════════════════════════════════════════════

import { UserRepository } from './user.repository';
import {
  UpdateProfileInput,
  CreateAddressInput,
  UpdateAddressInput,
  UserListQueryInput,
} from './user.types';
import { ApiError } from '../../utils/api-error';
import { hashPassword, comparePassword } from '../../utils/hash';
import { uploadToCloudinary } from '../../config/cloudinary';
import { logger } from '../../utils/logger';
import { UserRole } from '@nexastore/shared';

export class UserService {
  private repository: UserRepository;

  constructor(repository: UserRepository) {
    this.repository = repository;
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.repository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const { password, twoFactorSecret, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<any> {
    const user = await this.repository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const updated = await this.repository.update(userId, data);
    const { password, twoFactorSecret, ...profile } = updated;
    return profile;
  }

  async updateAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const user = await this.repository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const result = await uploadToCloudinary(file.buffer, 'nexastore/avatars');
    await this.repository.update(userId, { avatar: result.secureUrl });

    return result.secureUrl;
  }

  async changePassword(userId: string, current: string, newPass: string): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user || !user.password) {
      throw ApiError.badRequest('Invalid action');
    }

    const matches = await comparePassword(current, user.password);
    if (!matches) {
      throw ApiError.badRequest('Current password does not match');
    }

    const hashed = await hashPassword(newPass);
    await this.repository.update(userId, { password: hashed });

    // Revoke all sessions for security
    const { prisma } = require('../../config/database');
    await prisma.session.deleteMany({ where: { userId } });
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    await this.repository.softDelete(userId);

    // Invalidate sessions
    const { prisma } = require('../../config/database');
    await prisma.session.deleteMany({ where: { userId } });
    logger.info(`User self-deleted: ${userId}`);
  }

  async getAddresses(userId: string): Promise<any[]> {
    return this.repository.getAddresses(userId);
  }

  async createAddress(userId: string, data: CreateAddressInput): Promise<any> {
    if (data.isDefault) {
      await this.repository.unsetDefaultAddress(userId);
    } else {
      // If first address, make it default automatically
      const existing = await this.repository.getAddresses(userId);
      if (existing.length === 0) {
        data.isDefault = true;
      }
    }

    return this.repository.createAddress({
      userId,
      ...data,
    });
  }

  async updateAddress(userId: string, addressId: string, data: UpdateAddressInput): Promise<any> {
    const addresses = await this.repository.getAddresses(userId);
    const address = addresses.find((a) => a.id === addressId);

    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized');
    }

    if (data.isDefault) {
      await this.repository.unsetDefaultAddress(userId);
    }

    return this.repository.updateAddress(addressId, data);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const addresses = await this.repository.getAddresses(userId);
    const address = addresses.find((a) => a.id === addressId);

    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized');
    }

    await this.repository.deleteAddress(addressId);

    // If deleted address was default, promote another address to default
    if (address.isDefault && addresses.length > 1) {
      const nextAddress = addresses.find((a) => a.id !== addressId);
      if (nextAddress) {
        await this.repository.setDefaultAddress(userId, nextAddress.id);
      }
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    const addresses = await this.repository.getAddresses(userId);
    const address = addresses.find((a) => a.id === addressId);

    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized');
    }

    await this.repository.setDefaultAddress(userId, addressId);
  }

  async getAllUsers(query: UserListQueryInput): Promise<{ users: any[]; total: number }> {
    const result = await this.repository.findAll(query);
    const sanitizedUsers = result.users.map(({ password, twoFactorSecret, ...u }) => u);
    return { users: sanitizedUsers, total: result.total };
  }

  async getUserById(id: string): Promise<any> {
    const user = await this.repository.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    const { password, twoFactorSecret, ...profile } = user;
    return profile;
  }

  async updateUserRole(id: string, role: UserRole): Promise<any> {
    const user = await this.repository.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    const updated = await this.repository.update(id, { role });
    const { password, twoFactorSecret, ...profile } = updated;
    return profile;
  }

  async banUser(id: string): Promise<void> {
    const user = await this.repository.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    await this.repository.ban(id);

    // Force sign-out: invalidate all user sessions
    const { prisma } = require('../../config/database');
    await prisma.session.deleteMany({ where: { userId: id } });
    logger.info(`User banned: ${id}`);
  }

  async unbanUser(id: string): Promise<void> {
    const user = await this.repository.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    await this.repository.unban(id);
    logger.info(`User unbanned: ${id}`);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.repository.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    await this.repository.softDelete(id);

    // Force sign-out
    const { prisma } = require('../../config/database');
    await prisma.session.deleteMany({ where: { userId: id } });
    logger.info(`User soft-deleted by admin: ${id}`);
  }

  async getUserStats(): Promise<any> {
    const counts = await this.repository.countByRole();
    const { prisma } = require('../../config/database');
    const totalUsers = await prisma.user.count({ where: { deletedAt: null } });

    return {
      total: totalUsers,
      byRole: counts,
    };
  }
}
