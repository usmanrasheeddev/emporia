// ═══════════════════════════════════════════════════════════════
// Inventory Controller Layer
// Handles HTTP requests for stocks, transfers, and warehouse management
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { RequestWithUser } from '../../types';

const service = new InventoryService(new InventoryRepository());

export class InventoryController {
  // ─── Warehouses ──────────────────────────────────────────────

  static getWarehouses = asyncHandler(async (req: Request, res: Response) => {
    const list = await service.getWarehouses();
    res.json(ApiResponse.success('Warehouses retrieved successfully', list));
  });

  static getWarehouseById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const warehouse = await service.getWarehouseById(id);
    res.json(ApiResponse.success('Warehouse retrieved successfully', warehouse));
  });

  static createWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const warehouse = await service.createWarehouse(req.body);
    res.status(201).json(ApiResponse.success('Warehouse created successfully', warehouse, 201));
  });

  static updateWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const warehouse = await service.updateWarehouse(id, req.body);
    res.json(ApiResponse.success('Warehouse updated successfully', warehouse));
  });

  static deleteWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await service.deleteWarehouse(id);
    res.json(ApiResponse.success('Warehouse deleted successfully'));
  });

  // ─── Stock Levels ────────────────────────────────────────────

  static getStockForVariant = asyncHandler(async (req: Request, res: Response) => {
    const variantId = req.params.variantId as string;
    const stock = await service.getStockForVariant(variantId);
    res.json(ApiResponse.success('Stock levels retrieved successfully', stock));
  });

  static updateStock = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const variantId = req.params.variantId as string;
    const warehouseId = req.params.warehouseId as string;
    const { notes } = req.body;

    const stock = await service.updateStock(variantId, warehouseId, req.body, req.user?.id, notes);
    res.json(ApiResponse.success('Stock level updated successfully', stock));
  });

  // ─── Stock Transfers ─────────────────────────────────────────

  static getTransfers = asyncHandler(async (req: Request, res: Response) => {
    const { transfers, meta } = await service.getTransfers(req.query);
    res.json(ApiResponse.success('Transfers retrieved successfully', transfers, 200, meta));
  });

  static getTransferById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const transfer = await service.getTransferById(id);
    res.json(ApiResponse.success('Transfer retrieved successfully', transfer));
  });

  static initiateTransfer = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const transfer = await service.initiateTransfer(req.body, req.user!.id);
    res.status(201).json(ApiResponse.success('Stock transfer initiated successfully', transfer, 201));
  });

  static updateTransferStatus = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;

    const transfer = await service.updateTransferStatus(id, status, req.user!.id);
    res.json(ApiResponse.success('Transfer status updated successfully', transfer));
  });

  static getLowStockAlerts = asyncHandler(async (req: Request, res: Response) => {
    const { items, meta } = await service.getLowStockAlerts(req.query);
    res.json(ApiResponse.success('Low stock alerts retrieved successfully', items, 200, meta));
  });
}
