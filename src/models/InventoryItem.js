/**
 * InventoryItem Model - In-memory implementation
 * In production, this would be replaced with a proper database model (MongoDB, PostgreSQL, etc.)
 */

class InventoryItem {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.name = data.name;
    this.description = data.description || '';
    this.sku = data.sku;
    this.category = data.category || 'general';
    this.quantity = data.quantity || 0;
    this.minQuantity = data.minQuantity || 0;
    this.maxQuantity = data.maxQuantity || null;
    this.unitPrice = data.unitPrice || 0;
    this.totalValue = this.quantity * this.unitPrice;
    this.supplier = data.supplier || '';
    this.location = data.location || '';
    this.status = data.status || 'active'; // active, inactive, discontinued
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || null;
    this.deletedAt = data.deletedAt || null;
    this.createdBy = data.createdBy || null;
    this.updatedBy = data.updatedBy || null;
    this.lastRestockedAt = data.lastRestockedAt || null;
    this.expiryDate = data.expiryDate || null;
    this.batchNumber = data.batchNumber || null;
  }

  // Convert to safe object
  toSafeObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      sku: this.sku,
      category: this.category,
      quantity: this.quantity,
      minQuantity: this.minQuantity,
      maxQuantity: this.maxQuantity,
      unitPrice: this.unitPrice,
      totalValue: this.totalValue,
      supplier: this.supplier,
      location: this.location,
      status: this.status,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastRestockedAt: this.lastRestockedAt,
      expiryDate: this.expiryDate,
      batchNumber: this.batchNumber,
      isLowStock: this.isLowStock(),
      isOutOfStock: this.isOutOfStock()
    };
  }

  // Convert to JSON
  toJSON() {
    return this.toSafeObject();
  }

  // Update item data
  update(data, updatedBy = null) {
    const allowedFields = [
      'name', 'description', 'category', 'quantity', 'minQuantity', 
      'maxQuantity', 'unitPrice', 'supplier', 'location', 'status', 
      'isActive', 'expiryDate', 'batchNumber'
    ];
    
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        this[field] = data[field];
      }
    });

    // Recalculate total value
    this.totalValue = this.quantity * this.unitPrice;
    this.updatedAt = new Date().toISOString();
    this.updatedBy = updatedBy;
    
    return this;
  }

  // Update quantity
  updateQuantity(newQuantity, updatedBy = null) {
    const oldQuantity = this.quantity;
    this.quantity = Math.max(0, newQuantity);
    this.totalValue = this.quantity * this.unitPrice;
    this.updatedAt = new Date().toISOString();
    this.updatedBy = updatedBy;

    // Update restock date if quantity increased
    if (newQuantity > oldQuantity) {
      this.lastRestockedAt = new Date().toISOString();
    }

    return this;
  }

  // Add stock
  addStock(amount, updatedBy = null) {
    return this.updateQuantity(this.quantity + amount, updatedBy);
  }

  // Remove stock
  removeStock(amount, updatedBy = null) {
    return this.updateQuantity(this.quantity - amount, updatedBy);
  }

  // Soft delete
  softDelete(deletedBy = null) {
    this.isActive = false;
    this.status = 'inactive';
    this.deletedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.updatedBy = deletedBy;
    return this;
  }

  // Restore from soft delete
  restore(restoredBy = null) {
    this.isActive = true;
    this.status = 'active';
    this.deletedAt = null;
    this.updatedAt = new Date().toISOString();
    this.updatedBy = restoredBy;
    return this;
  }

  // Check if item is low stock
  isLowStock() {
    return this.quantity <= this.minQuantity && this.quantity > 0;
  }

  // Check if item is out of stock
  isOutOfStock() {
    return this.quantity === 0;
  }

  // Check if item is overstocked
  isOverstocked() {
    return this.maxQuantity && this.quantity > this.maxQuantity;
  }

  // Check if item is expired
  isExpired() {
    return this.expiryDate && new Date(this.expiryDate) < new Date();
  }

  // Get stock status
  getStockStatus() {
    if (this.isOutOfStock()) return 'out_of_stock';
    if (this.isLowStock()) return 'low_stock';
    if (this.isOverstocked()) return 'overstocked';
    return 'normal';
  }

  // Validate inventory item data
  static validate(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate) {
      // Required fields for creation
      if (!data.name) {
        errors.push('Name is required');
      }
      if (!data.sku) {
        errors.push('SKU is required');
      }
    }

    // Name validation
    if (data.name !== undefined) {
      if (typeof data.name !== 'string') {
        errors.push('Name must be a string');
      } else if (data.name.length < 2 || data.name.length > 100) {
        errors.push('Name must be between 2 and 100 characters');
      }
    }

    // SKU validation
    if (data.sku !== undefined) {
      if (typeof data.sku !== 'string') {
        errors.push('SKU must be a string');
      } else if (data.sku.length < 2 || data.sku.length > 50) {
        errors.push('SKU must be between 2 and 50 characters');
      } else if (!/^[a-zA-Z0-9_-]+$/.test(data.sku)) {
        errors.push('SKU can only contain letters, numbers, underscores, and hyphens');
      }
    }

    // Description validation
    if (data.description !== undefined && typeof data.description !== 'string') {
      errors.push('Description must be a string');
    }

    // Category validation
    if (data.category !== undefined) {
      const validCategories = ['general', 'electronics', 'clothing', 'food', 'books', 'tools', 'medical', 'automotive'];
      if (!validCategories.includes(data.category)) {
        errors.push('Category must be one of: ' + validCategories.join(', '));
      }
    }

    // Quantity validation
    if (data.quantity !== undefined) {
      if (typeof data.quantity !== 'number' || data.quantity < 0) {
        errors.push('Quantity must be a non-negative number');
      }
    }

    // Min quantity validation
    if (data.minQuantity !== undefined) {
      if (typeof data.minQuantity !== 'number' || data.minQuantity < 0) {
        errors.push('Minimum quantity must be a non-negative number');
      }
    }

    // Max quantity validation
    if (data.maxQuantity !== undefined && data.maxQuantity !== null) {
      if (typeof data.maxQuantity !== 'number' || data.maxQuantity < 0) {
        errors.push('Maximum quantity must be a non-negative number');
      }
      if (data.minQuantity !== undefined && data.maxQuantity < data.minQuantity) {
        errors.push('Maximum quantity must be greater than minimum quantity');
      }
    }

    // Unit price validation
    if (data.unitPrice !== undefined) {
      if (typeof data.unitPrice !== 'number' || data.unitPrice < 0) {
        errors.push('Unit price must be a non-negative number');
      }
    }

    // Status validation
    if (data.status !== undefined) {
      const validStatuses = ['active', 'inactive', 'discontinued'];
      if (!validStatuses.includes(data.status)) {
        errors.push('Status must be one of: ' + validStatuses.join(', '));
      }
    }

    // isActive validation
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    }

    // Expiry date validation
    if (data.expiryDate !== undefined && data.expiryDate !== null) {
      const expiryDate = new Date(data.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Expiry date must be a valid date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = InventoryItem;