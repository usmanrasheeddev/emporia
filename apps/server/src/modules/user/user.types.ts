// ═══════════════════════════════════════════════════════════════
// User Module Types
// Types specific to the user profile and addresses management flow
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  adminUpdateUserSchema,
  userListQuerySchema,
} from './user.validator';

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type UserListQueryInput = z.infer<typeof userListQuerySchema>;
