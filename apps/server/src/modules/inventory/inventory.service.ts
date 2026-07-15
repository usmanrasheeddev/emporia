// ═══════════════════════════════════════════════════════════════
// Inventory & Stock Service Layer
// Orchestrates stock levels, manual adjustments, and secure stock transfers
// ═══════════════════════════════════════════════════════════════

import { InventoryRepository } from './inventory.repository';
import { ApiError } from '../../utils/api-error';
import { prisma } from '../../config/database';
import { buildPaginationMeta } from '../../utils/pagination';
import { TransferStatus, InventoryLogType } from '@nexastore/shared';

export class InventoryService {
  private repo: InventoryRepository;

  constructor(repo: InventoryRepository) {
    this.repo = repo;
  }

  // ─── Warehouses ──────────────────────────────────────────────

  async getWarehouses() {
    return this.repo.findAllWarehouses();
  }

  async getWarehouseById(id: string) {
    const warehouse = await this.repo.findWarehouseById(id);
    if (!warehouse) throw ApiError.notFound('Warehouse not found');
    return warehouse;
  }

  async createWarehouse(data: any) {
    const codeExists = await this.repo.findWarehouseByCode(data.code);
    if (codeExists) throw ApiError.conflict('Warehouse code already in use');

    if (data.managerId) {
      const user = await prisma.user.findFirst({ where: { id: data.managerId, deletedAt: null } });
      if (!user) throw ApiError.badRequest('Invalid manager user ID');
    }

    return this.repo.createWarehouse(data);
  }

  async updateWarehouse(id: string, data: any) {
    await this.getWarehouseById(id);

    if (data.code) {
      const existing = await this.repo.findWarehouseByCode(data.code);
      if (existing && existing.id !== id) throw ApiError.conflict('Warehouse code already in use');
    }

    if (data.managerId) {
      const user = await prisma.user.findFirst({ where: { id: data.managerId, deletedAt: null } });
      if (!user) throw ApiError.badRequest('Invalid manager user ID');
    }

    return this.repo.updateWarehouse(id, data);
  }

  async deleteWarehouse(id: string) {
    const warehouse = await this.getWarehouseById(id);
    // Check if warehouse has stock items with quantity > 0
    const stockCount = await prisma.inventoryItem.count({
      where: { warehouseId: id, quantity: { gt: 0 } },
    });

    if (stockCount > 0) {
      throw ApiError.badRequest('Cannot delete a warehouse that contains active product stock');
    }

    await this.repo.deleteWarehouse(id);
  }

  // ─── Stock Levels & Adjustments ──────────────────────────────

  async getStockForVariant(variantId: string) {
    return this.repo.getStockForVariant(variantId);
  }

  async updateStock(
    variantId: string,
    warehouseId: string,
    data: {
      quantity?: number;
      reservedQuantity?: number;
      reorderPoint?: number;
      reorderQuantity?: number;
    },
    userId?: string,
    notes?: string
  ) {
    // Verify variant and warehouse exist
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw ApiError.notFound('Product variant not found');

    const warehouse = await this.repo.findWarehouseById(warehouseId);
    if (!warehouse) throw ApiError.notFound('Warehouse not found');

    return prisma.$transaction(async (tx) => {
      let stock = await tx.inventoryItem.findUnique({
        where: { variantId_warehouseId: { variantId, warehouseId } },
      });

      const prevQty = stock ? stock.quantity : 0;
      const newQty = data.quantity !== undefined ? data.quantity : prevQty;

      if (!stock) {
        stock = await tx.inventoryItem.create({
          data: {
            variantId,
            warehouseId,
            quantity: newQty,
            reservedQuantity: data.reservedQuantity || 0,
            reorderPoint: data.reorderPoint || 10,
            reorderQuantity: data.reorderQuantity || 50,
          },
        });
      } else {
        stock = await tx.inventoryItem.update({
          where: { variantId_warehouseId: { variantId, warehouseId } },
          data: {
            quantity: data.quantity !== undefined ? data.quantity : undefined,
            reservedQuantity: data.reservedQuantity,
            reorderPoint: data.reorderPoint,
            reorderQuantity: data.reorderQuantity,
          },
        });
      }

      // Record adjustment log if quantity changed
      if (prevQty !== newQty) {
        const qtyDiff = newQty - prevQty;
        await tx.inventoryLog.create({
          data: {
            variantId,
            warehouseId,
            type: qtyDiff > 0 ? InventoryLogType.STOCK_IN : InventoryLogType.STOCK_OUT,
            quantity: Math.abs(qtyDiff),
            previousQuantity: prevQty,
            newQuantity: newQty,
            notes: notes || 'Manual adjustment',
            createdById: userId,
          },
        });

        // Update overall cached stock in ProductVariant table
        const totalStock = await tx.inventoryItem.aggregate({
          where: { variantId },
          _sum: { quantity: true },
        });

        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: totalStock._sum.quantity || 0 },
        });
      }

      return stock;
    });
  }

  // ─── Stock Transfers ─────────────────────────────────────────

  async getTransfers(query: any) {
    const { transfers, total } = await this.repo.findAllTransfers(query);
    return {
      transfers,
      meta: buildPaginationMeta(total, query.page || 1, query.limit || 20),
    };
  }

  async getTransferById(id: string) {
    const transfer = await this.repo.findTransferById(id);
    if (!transfer) throw ApiError.notFound('Stock transfer not found');
    return transfer;
  }

  async initiateTransfer(
    data: {
      fromWarehouseId: string;
      toWarehouseId: string;
      variantId: string;
      quantity: number;
      notes?: string;
    },
    userId: string
  ) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw ApiError.badRequest('Source and destination warehouses cannot be the same');
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: data.variantId } });
    if (!variant) throw ApiError.notFound('Product variant not found');

    const sourceStock = await this.repo.findStockItem(data.variantId, data.fromWarehouseId);
    if (!sourceStock || sourceStock.quantity < data.quantity) {
      throw ApiError.badRequest('Insufficient stock in source warehouse for transfer');
    }

    return this.repo.createTransfer({
      ...data,
      initiatedById: userId,
    });
  }

  async updateTransferStatus(id: string, status: TransferStatus, userId: string) {
    const transfer = await this.getTransferById(id);

    if (transfer.status === TransferStatus.COMPLETED || transfer.status === TransferStatus.CANCELLED) {
      throw ApiError.badRequest(`Cannot modify a completed or cancelled transfer`);
    }

    return prisma.$transaction(async (tx) => {
      // ─── Transition: PENDING -> IN_TRANSIT ───────────────────
      if (transfer.status === TransferStatus.PENDING && status === TransferStatus.IN_TRANSIT) {
        // Fetch source stock
        const sourceStock = await tx.inventoryItem.findUnique({
          where: { variantId_warehouseId: { variantId: transfer.variantId, warehouseId: transfer.fromWarehouseId } },
        });

        if (!sourceStock || sourceStock.quantity < transfer.quantity) {
          throw ApiError.badRequest('Insufficient stock in source warehouse to ship');
        }

        // Deduct from source warehouse
        const updatedSource = await tx.inventoryItem.update({
          where: { variantId_warehouseId: { variantId: transfer.variantId, warehouseId: transfer.fromWarehouseId } },
          data: { quantity: { decrement: transfer.quantity } },
        });

        // Log deduction
        await tx.inventoryLog.create({
          data: {
            variantId: transfer.variantId,
            warehouseId: transfer.fromWarehouseId,
            type: InventoryLogType.TRANSFER,
            quantity: transfer.quantity,
            previousQuantity: sourceStock.quantity,
            newQuantity: updatedSource.quantity,
            reference: 'STOCK_TRANSFER',
            referenceId: transfer.id,
            notes: `Transfer shipped to ${transfer.toWarehouseId}`,
            createdById: userId,
          },
        });
      }

      // ─── Transition: IN_TRANSIT -> COMPLETED ─────────────────
      if (transfer.status === TransferStatus.IN_TRANSIT && status === TransferStatus.COMPLETED) {
        // Fetch or create destination stock
        let destStock = await tx.inventoryItem.findUnique({
          where: { variantId_warehouseId: { variantId: transfer.variantId, warehouseId: transfer.toWarehouseId } },
        });

        const prevQty = destStock ? destStock.quantity : 0;

        if (!destStock) {
          destStock = await tx.inventoryItem.create({
            data: {
              variantId: transfer.variantId,
              warehouseId: transfer.toWarehouseId,
              quantity: transfer.quantity,
            },
          });
        } else {
          destStock = await tx.inventoryItem.update({
            where: { variantId_warehouseId: { variantId: transfer.variantId, warehouseId: transfer.toWarehouseId } },
            data: { quantity: { increment: transfer.quantity } },
          });
        }

        // Log intake
        await tx.inventoryLog.create({
          data: {
            variantId: transfer.variantId,
            warehouseId: transfer.toWarehouseId,
            type: InventoryLogType.TRANSFER,
            quantity: transfer.quantity,
            previousQuantity: prevQty,
            newQuantity: destStock.quantity,
            reference: 'STOCK_TRANSFER',
            referenceId: transfer.id,
            notes: `Transfer received from ${transfer.fromWarehouseId}`,
            createdById: userId,
          },
        });
      }

      // ─── Transition: (PENDING or IN_TRANSIT) -> CANCELLED ─────
      if (status === TransferStatus.CANCELLED) {
        // If it was already shipped (IN_TRANSIT), return stock to source
        if (transfer.status === TransferStatus.IN_TRANSIT) {
          const sourceStock = await tx.inventoryItem.findUnique({
            where: { variantId_warehouseId: { variantId: transfer.variantId, warehouseId: transfer.fromWarehouseId } },
          });

          const prevQty = sourceStock ? sourceStock.quantity : 0;

          await tx.inventoryItem.update({
            where: { variantId_warehouseId: { variantId: transfer.variantId, warehouseId: transfer.fromWarehouseId } },
            data: { quantity: { increment: transfer.quantity } },
          });

          await tx.inventoryLog.create({
            data: {
              variantId: transfer.variantId,
              warehouseId: transfer.fromWarehouseId,
              type: InventoryLogType.TRANSFER,
              quantity: transfer.quantity,
              previousQuantity: prevQty,
              newQuantity: prevQty + transfer.quantity,
              reference: 'STOCK_TRANSFER_CANCEL',
              referenceId: transfer.id,
              notes: 'Transfer cancelled, stock returned',
              createdById: userId,
          },
          });
        }
      }

      // Update transfer entry
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: {
          status,
          completedAt: status === TransferStatus.COMPLETED ? new Date() : undefined,
        },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          variant: true,
        },
      });

      // Update cached total variant stock on completed / cancelled operations
      const totalStock = await tx.inventoryItem.aggregate({
        where: { variantId: transfer.variantId },
        _sum: { quantity: true },
      });

      await tx.productVariant.update({
        where: { id: transfer.variantId },
        data: { stock: totalStock._sum.quantity || 0 },
      });

      return updatedTransfer;
    });
  }
}
