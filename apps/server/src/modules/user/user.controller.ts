// ═══════════════════════════════════════════════════════════════
// User Controller Layer
// Maps profile changes and addresses operations to HTTP requests
// ═══════════════════════════════════════════════════════════════

import { Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { RequestWithUser } from '../../types';
import { ApiError } from '../../utils/api-error';

const repository = new UserRepository();
const userService = new UserService(repository);

export class UserController {
  static getProfile = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const profile = await userService.getProfile(req.user!.id);
    res.status(200).json(ApiResponse.success('User profile retrieved successfully', profile));
  });

  static updateProfile = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const updated = await userService.updateProfile(req.user!.id, req.body);
    res.status(200).json(ApiResponse.success('Profile updated successfully', updated));
  });

  static updateAvatar = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }
    const avatarUrl = await userService.updateAvatar(req.user!.id, req.file);
    res.status(200).json(ApiResponse.success('Avatar updated successfully', { avatarUrl }));
  });

  static changePassword = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user!.id, currentPassword, newPassword);
    res.status(200).json(ApiResponse.success('Password changed successfully. Please log in again.'));
  });

  static deleteAccount = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    await userService.deleteAccount(req.user!.id);
    res.status(200).json(ApiResponse.success('Your account has been deleted successfully'));
  });

  static getAddresses = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const addresses = await userService.getAddresses(req.user!.id);
    res.status(200).json(ApiResponse.success('User addresses retrieved successfully', addresses));
  });

  static createAddress = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const address = await userService.createAddress(req.user!.id, req.body);
    res.status(201).json(ApiResponse.success('Address created successfully', address, 201));
  });

  static updateAddress = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const address = await userService.updateAddress(req.user!.id, id, req.body);
    res.status(200).json(ApiResponse.success('Address updated successfully', address));
  });

  static deleteAddress = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await userService.deleteAddress(req.user!.id, id);
    res.status(200).json(ApiResponse.success('Address deleted successfully'));
  });

  static setDefaultAddress = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await userService.setDefaultAddress(req.user!.id, id);
    res.status(200).json(ApiResponse.success('Default address updated successfully'));
  });

  // ─── Admin Dashboard Endpoints ──────────────────────────────

  static getAll = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const result = await userService.getAllUsers(req.query as any);
    res.status(200).json(ApiResponse.success('Users list retrieved successfully', result.users, 200, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      total: result.total,
      totalPages: Math.ceil(result.total / (Number(req.query.limit) || 20)),
      hasNext: (Number(req.query.page) || 1) * (Number(req.query.limit) || 20) < result.total,
      hasPrev: (Number(req.query.page) || 1) > 1,
    }));
  });

  static getUserById = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const user = await userService.getUserById(id);
    res.status(200).json(ApiResponse.success('User retrieved successfully', user));
  });

  static updateUserRole = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { role } = req.body;
    const updated = await userService.updateUserRole(id, role);
    res.status(200).json(ApiResponse.success('User role updated successfully', updated));
  });

  static banUser = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await userService.banUser(id);
    res.status(200).json(ApiResponse.success('User banned successfully'));
  });

  static unbanUser = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await userService.unbanUser(id);
    res.status(200).json(ApiResponse.success('User unbanned successfully'));
  });

  static deleteUser = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await userService.deleteUser(id);
    res.status(200).json(ApiResponse.success('User deleted successfully'));
  });

  static getUserStats = asyncHandler(async (req: RequestWithUser, res: Response): Promise<void> => {
    const stats = await userService.getUserStats();
    res.status(200).json(ApiResponse.success('User stats retrieved successfully', stats));
  });
}
