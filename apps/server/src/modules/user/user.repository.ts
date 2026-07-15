// ═══════════════════════════════════════════════════════════════
// User Database Repository
// Handles database reads and updates for user accounts and addresses
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { User, Address } from '@prisma/client';
import { UserListQueryInput } from './user.types';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findAll(query: UserListQueryInput): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, role, isBanned } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (role) where.role = role;
    if (isBanned !== undefined) where.isBanned = isBanned;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async update(id: string, data: any): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async ban(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isBanned: true },
    });
  }

  async unban(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { isBanned: false },
    });
  }

  async getAddresses(userId: string): Promise<Address[]> {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async createAddress(data: any): Promise<Address> {
    return prisma.address.create({
      data,
    });
  }

  async updateAddress(id: string, data: any): Promise<Address> {
    return prisma.address.update({
      where: { id },
      data,
    });
  }

  async deleteAddress(id: string): Promise<void> {
    await prisma.address.delete({
      where: { id },
    });
  }

  async unsetDefaultAddress(userId: string): Promise<void> {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    await prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  async countByRole(): Promise<Record<string, number>> {
    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        _all: true,
      },
      where: { deletedAt: null },
    });

    const result: Record<string, number> = {};
    for (const item of counts) {
      result[item.role] = item._count._all;
    }

    return result;
  }
}
