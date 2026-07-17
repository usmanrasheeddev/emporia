// ═══════════════════════════════════════════════════════════════
// Inventory & Warehouse Routes
// Restricted management paths for stocks, warehouses, and transfers
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { UserRole } from '@nexastore/shared';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  updateStockSchema,
  createStockTransferSchema,
  updateStockTransferSchema,
} from './inventory.validator';

const router = Router();

// Apply auth to all inventory routes
router.use(authenticate);

// ─── Warehouses ──────────────────────────────────────────────

router.get('/warehouses', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER), InventoryController.getWarehouses);
router.get('/warehouses/:id', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER), InventoryController.getWarehouseById);

router.post('/warehouses', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(createWarehouseSchema), InventoryController.createWarehouse);
router.patch('/warehouses/:id', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), validate(updateWarehouseSchema), InventoryController.updateWarehouse);
router.delete('/warehouses/:id', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), InventoryController.deleteWarehouse);

// ─── Stock Levels ────────────────────────────────────────────

router.get('/stock/:variantId', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER), InventoryController.getStockForVariant);
router.patch('/stock/:variantId/:warehouseId', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER), validate(updateStockSchema), InventoryController.updateStock);
router.get('/low-stock', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER), InventoryController.getLowStockAlerts);

// ─── Stock Transfers ─────────────────────────────────────────

router.get('/transfers', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER), InventoryController.getTransfers);
router.get('/transfers/:id', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER), InventoryController.getTransferById);

router.post('/transfers', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER), validate(createStockTransferSchema), InventoryController.initiateTransfer);
router.patch('/transfers/:id/status', authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER), validate(updateStockTransferSchema), InventoryController.updateTransferStatus);

export default router;
//
