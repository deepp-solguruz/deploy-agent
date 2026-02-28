const InventoryItem = require('../models/InventoryItem');

/**
 * InventoryService - Business logic for inventory management
 * In production, this would interact with a proper database
 */

class InventoryService {
  constructor() {
    // In-memory storage (replace with database in production)
    this.items = new Map();
    this.initializeSampleData();
  }

  // Initialize with sample data for demo purposes
  initializeSampleData() {
    const sampleItems = [
      {
        id: '1',
        name: 'Laptop Computer',
        description: 'High-performance laptop for business use',
        sku: 'LAP-001',
        category: 'electronics',
        quantity: 25,
        minQuantity: 5,
        maxQuantity: 100,
        unitPrice: 999.99,
        supplier: 'Tech Supplier Inc',
        location: 'Warehouse A-1',
        batchNumber: 'BATCH-2024-001'
      },
      {
        id: '2',
        name: 'Office Chair',
        description: 'Ergonomic office chair with lumbar support',
        sku: 'CHR-001',
        category: 'general',
        quantity: 3,
        minQuantity: 10,
        maxQuantity: 50,
        unitPrice: 299.99,
        supplier: 'Furniture Co',
        location: 'Warehouse B-2'
      }
    ];

    sampleItems.forEach(itemData => {
      const item = new InventoryItem(itemData);
      this.items.set(item.id, item);
    });
  }

  // Get all items with optional filtering
  async getAllItems(filters = {}) {
    try {
      let items = Array.from(this.items.values());

      // Apply filters
      if (filters.category) {
        items = items.filter(item => item.category === filters.category);
      }

      if (filters.status) {
        items = items.filter(item => item.status === filters.status);
      }

      if (filters.isActive !== undefined) {
        items = items.filter(item => item.isActive === filters.isActive);
      }

      if (filters.lowStock) {
        items = items.filter(item => item.isLowStock());
      }

      if (filters.outOfStock) {
        items = items.filter(item => item.isOutOfStock());
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchTerm) ||
          item.sku.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm)
        );
      }

      // Apply pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const offset = (page - 1) * limit;
      
      const total = items.length;
      const paginatedItems = items.slice(offset, offset + limit);

      return {
        items: paginatedItems.map(item => item.toSafeObject()),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to retrieve items: ${error.message}`);
    }
  }

  // Get item by ID
  async getItemById(id) {
    try {
      const item = this.items.get(id);
      if (!item) {
        throw new Error('Item not found');
      }
      return item.toSafeObject();
    } catch (error) {
      throw new Error(`Failed to retrieve item: ${error.message}`);
    }
  }

  // Get item by SKU
  async getItemBySku(sku) {
    try {
      const item = Array.from(this.items.values()).find(item => item.sku === sku);
      if (!item) {
        throw new Error('Item not found');
      }
      return item.toSafeObject();
    } catch (error) {
      throw new Error(`Failed to retrieve item: ${error.message}`);
    }
  }

  // Create new item
  async createItem(itemData, createdBy = null) {
    try {
      // Validate data
      const validation = InventoryItem.validate(itemData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if SKU already exists
      const existingItem = Array.from(this.items.values()).find(item => item.sku === itemData.sku);
      if (existingItem) {
        throw new Error('SKU already exists');
      }

      // Create item
      const item = new InventoryItem({
        ...itemData,
        createdBy
      });

      this.items.set(item.id, item);
      return item.toSafeObject();
    } catch (error) {
      throw new Error(`Failed to create item: ${error.message}`);
    }
  }

  // Update item
  async updateItem(id, updateData, updatedBy = null) {
    try {
      const item = this.items.get(id);
      if (!item) {
        throw new Error('Item not found');
      }

      // Validate update data
      const validation = InventoryItem.validate(updateData, true);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if SKU already exists (if being updated)
      if (updateData.sku && updateData.sku !== item.sku) {
        const existingItem = Array.from(this.items.values()).find(
          i => i.sku === updateData.sku && i.id !== id
        );
        if (existingItem) {
          throw new Error('SKU already exists');
        }
      }

      // Update item
      item.update(updateData, updatedBy);
      this.items.set(id, item);
      
      return item.toSafeObject();
    } catch (error) {
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  // Delete item (soft delete)
  async deleteItem(id, deletedBy = null) {
    try {
      const item = this.items.get(id);
      if (!item) {
        throw new Error('Item not found');
      }

      item.softDelete(deletedBy);
      this.items.set(id, item);
      
      return item.toSafeObject();
    } catch (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  // Restore item
  async restoreItem(id, restoredBy = null) {
    try {
      const item = this.items.get(id);
      if (!item) {
        throw new Error('Item not found');
      }

      item.restore(restoredBy);
      this.items.set(id, item);
      
      return item.toSafeObject();
    } catch (error) {
      throw new Error(`Failed to restore item: ${error.message}`);
    }
  }

  // Update item quantity
  async updateQuantity(id, newQuantity, updatedBy = null) {
    try {
      const item = this.items.get(id);
      if (!item) {
        throw new Error('Item not found');
      }

      if (typeof newQuantity !== 'number' || newQuantity < 0) {
        throw new Error('Quantity must be a non-negative number');
      }

      item.updateQuantity(newQuantity, updatedBy);
      this.items.set(id, item);
      
      return item.toSafeObject();
    } catch (error) {
      throw new Error(`Failed to update quantity: ${error.message}`);
    }
  }

  // Add stock
  async addStock(id, amount, updatedBy = null) {
    try {
      const item = this.items.get(id);
      if (!item) {
        throw new Error('Item not found');
      }

      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('Amount must be a positive number');
      }

      item.addStock(amount, updatedBy);
      this.items.set(id, item);
      
      return item.toSafeObject();
    } catch (error) {
      throw new Error(`Failed to add stock: ${error.message}`);
    }
  }

  // Remove stock
  async removeStock(id, amount, updatedBy = null) {
    try {
      const item = this.items.get(id);
      if (!item) {
        throw new Error('Item not found');
      }

      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('Amount must be a positive number');
      }

      if (item.quantity < amount) {
        throw new Error('Insufficient stock');
      }

      item.removeStock(amount, updatedBy);
      this.items.set(id, item);
      
      return item.toSafeObject();
    } catch (error) {
      throw new Error(`Failed to remove stock: ${error.message}`);
    }
  }

  // Get low stock items
  async getLowStockItems() {
    try {
      const items = Array.from(this.items.values())
        .filter(item => item.isActive && item.isLowStock())
        .map(item => item.toSafeObject());

      return items;
    } catch (error) {
      throw new Error(`Failed to retrieve low stock items: ${error.message}`);
    }
  }

  // Get out of stock items
  async getOutOfStockItems() {
    try {
      const items = Array.from(this.items.values())
        .filter(item => item.isActive && item.isOutOfStock())
        .map(item => item.toSafeObject());

      return items;
    } catch (error) {
      throw new Error(`Failed to retrieve out of stock items: ${error.message}`);
    }
  }

  // Get inventory summary
  async getInventorySummary() {
    try {
      const items = Array.from(this.items.values()).filter(item => item.isActive);
      
      const summary = {
        totalItems: items.length,
        totalValue: items.reduce((sum, item) => sum + item.totalValue, 0),
        lowStockItems: items.filter(item => item.isLowStock()).length,
        outOfStockItems: items.filter(item => item.isOutOfStock()).length,
        categories: {},
        topValueItems: items
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 5)
          .map(item => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            totalValue: item.totalValue
          }))
      };

      // Count items by category
      items.forEach(item => {
        summary.categories[item.category] = (summary.categories[item.category] || 0) + 1;
      });

      return summary;
    } catch (error) {
      throw new Error(`Failed to generate inventory summary: ${error.message}`);
    }
  }

  // Search items
  async searchItems(query, options = {}) {
    try {
      if (!query || query.trim().length < 2) {
        throw new Error('Search query must be at least 2 characters long');
      }

      const searchTerm = query.toLowerCase().trim();
      const items = Array.from(this.items.values())
        .filter(item => {
          if (!item.isActive) return false;
          
          return item.name.toLowerCase().includes(searchTerm) ||
                 item.sku.toLowerCase().includes(searchTerm) ||
                 item.description.toLowerCase().includes(searchTerm) ||
                 item.category.toLowerCase().includes(searchTerm) ||
                 item.supplier.toLowerCase().includes(searchTerm);
        });

      // Apply pagination
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      const offset = (page - 1) * limit;
      
      const total = items.length;
      const paginatedItems = items.slice(offset, offset + limit);

      return {
        items: paginatedItems.map(item => item.toSafeObject()),
        query: searchTerm,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }
}

module.exports = new InventoryService();