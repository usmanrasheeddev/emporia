// ═══════════════════════════════════════════════════════════════
// Inventory & Warehouse Database Repository
// Direct access layer for stocks, transfers, and warehouse tables
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { Warehouse, InventoryItem, StockTransfer, Prisma } from '@prisma/client';

export class InventoryRepository {
  // ─── Warehouse CRUD ──────────────────────────────────────────

  async findAllWarehouses(): Promise<Warehouse[]> {
    return prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
      include: { manager: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findWarehouseById(id: string): Promise<Warehouse | null> {
    return prisma.warehouse.findUnique({
      where: { id },
      include: { manager: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findWarehouseByCode(code: string): Promise<Warehouse | null> {
    return prisma.warehouse.findUnique({ where: { code } });
  }

  async createWarehouse(data: any): Promise<Warehouse> {
    return prisma.warehouse.create({ data });
  }

  async updateWarehouse(id: string, data: any): Promise<Warehouse> {
    return prisma.warehouse.update({ where: { id }, data });
  }

  async deleteWarehouse(id: string): Promise<void> {
    await prisma.warehouse.delete({ where: { id } });
  }

  // ─── Stock Levels ────────────────────────────────────────────

  async findStockItem(variantId: string, warehouseId: string): Promise<InventoryItem | null> {
    return prisma.inventoryItem.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } },
    });
  }

  async createStockItem(data: {
    variantId: string;
    warehouseId: string;
    quantity?: number;
    reservedQuantity?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
  }): Promise<InventoryItem> {
    return prisma.inventoryItem.create({ data });
  }

  async updateStockItem(
    variantId: string,
    warehouseId: string,
    data: Prisma.InventoryItemUpdateInput
  ): Promise<InventoryItem> {
    return prisma.inventoryItem.update({
      where: { variantId_warehouseId: { variantId, warehouseId } },
      data,
    });
  }

  async getStockForVariant(variantId: string): Promise<InventoryItem[]> {
    return prisma.inventoryItem.findMany({
      where: { variantId },
      include: { warehouse: { select: { id: true, name: true, code: true } } },
    });
  }

  // ─── Stock Transfers ─────────────────────────────────────────

  async createTransfer(data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    variantId: string;
    quantity: number;
    notes?: string;
    initiatedById: string;
  }): Promise<StockTransfer> {
    return prisma.stockTransfer.create({
      data,
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        variant: true,
        initiatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findTransferById(id: string): Promise<StockTransfer | null> {
    return prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        variant: true,
        initiatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAllTransfers(query: any): Promise<{ transfers: StockTransfer[]; total: number }> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          fromWarehouse: { select: { name: true, code: true } },
          toWarehouse: { select: { name: true, code: true } },
          variant: { select: { name: true, sku: true } },
        },
      }),
      prisma.stockTransfer.count(),
    ]);

    return { transfers, total };
  }

  async updateTransferStatus(id: string, status: any, completedAt?: Date): Promise<StockTransfer> {
    return prisma.stockTransfer.update({
      where: { id },
      data: { status, completedAt },
    });
  }

  async findLowStockAlerts(page: number, limit: number): Promise<{ items: any[]; total: number }> {
    const skip = (page - 1) * limit;

    // 1. Get IDs of low stock items
    const rawIds = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM inventory_items 
      WHERE quantity <= "reorderPoint"
      ORDER BY "updatedAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;
    const ids = rawIds.map((row) => row.id);

    // 2. Get total count
    const countResult = await prisma.$queryRaw<Array<{ count: string | number | bigint }>>`
      SELECT COUNT(*)::bigint as count FROM inventory_items 
      WHERE quantity <= "reorderPoint"
    `;
    const total = Number(countResult[0]?.count || 0);

    if (ids.length === 0) {
      return { items: [], total };
    }

    // 3. Query details via standard Prisma client
    const items = await prisma.inventoryItem.findMany({
      where: { id: { in: ids } },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        warehouse: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return { items, total };
  }

  // ─── Inventory Logs ──────────────────────────────────────────

  async createInventoryLog(data: {
    variantId: string;
    warehouseId: string;
    type: any;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    reference?: string;
    referenceId?: string;
    notes?: string;
    createdById?: string;
  }) {
    return prisma.inventoryLog.create({ data });
  }
}
