const InventoryItem = require('../../../src/models/InventoryItem');

describe('InventoryItem Model', () => {
  describe('Constructor', () => {
    test('should create item with required fields', () => {
      const itemData = {
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 10,
        unitPrice: 99.99
      };

      const item = new InventoryItem(itemData);

      expect(item.name).toBe('Test Item');
      expect(item.sku).toBe('TEST-001');
      expect(item.quantity).toBe(10);
      expect(item.unitPrice).toBe(99.99);
      expect(item.totalValue).toBe(999.9);
      expect(item.category).toBe('general');
      expect(item.isActive).toBe(true);
      expect(item.status).toBe('active');
      expect(item.id).toBeDefined();
      expect(item.createdAt).toBeDefined();
    });

    test('should create item with all fields', () => {
      const itemData = {
        id: 'custom-id',
        name: 'Test Item',
        description: 'Test description',
        sku: 'TEST-001',
        category: 'electronics',
        quantity: 10,
        minQuantity: 5,
        maxQuantity: 100,
        unitPrice: 99.99,
        supplier: 'Test Supplier',
        location: 'A-1',
        status: 'active',
        isActive: true,
        expiryDate: '2024-12-31',
        batchNumber: 'BATCH-001'
      };

      const item = new InventoryItem(itemData);

      expect(item.id).toBe('custom-id');
      expect(item.description).toBe('Test description');
      expect(item.category).toBe('electronics');
      expect(item.minQuantity).toBe(5);
      expect(item.maxQuantity).toBe(100);
      expect(item.supplier).toBe('Test Supplier');
      expect(item.location).toBe('A-1');
      expect(item.expiryDate).toBe('2024-12-31');
      expect(item.batchNumber).toBe('BATCH-001');
    });

    test('should set default values for optional fields', () => {
      const itemData = {
        name: 'Test Item',
        sku: 'TEST-001'
      };

      const item = new InventoryItem(itemData);

      expect(item.description).toBe('');
      expect(item.category).toBe('general');
      expect(item.quantity).toBe(0);
      expect(item.minQuantity).toBe(0);
      expect(item.maxQuantity).toBe(null);
      expect(item.unitPrice).toBe(0);
      expect(item.totalValue).toBe(0);
      expect(item.supplier).toBe('');
      expect(item.location).toBe('');
      expect(item.status).toBe('active');
      expect(item.isActive).toBe(true);
    });
  });

  describe('toSafeObject', () => {
    test('should return safe object with all fields', () => {
      const itemData = {
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 10,
        minQuantity: 5,
        unitPrice: 99.99
      };

      const item = new InventoryItem(itemData);
      const safeObject = item.toSafeObject();

      expect(safeObject).toHaveProperty('id');
      expect(safeObject).toHaveProperty('name', 'Test Item');
      expect(safeObject).toHaveProperty('sku', 'TEST-001');
      expect(safeObject).toHaveProperty('quantity', 10);
      expect(safeObject).toHaveProperty('unitPrice', 99.99);
      expect(safeObject).toHaveProperty('totalValue', 999.9);
      expect(safeObject).toHaveProperty('isLowStock', true);
      expect(safeObject).toHaveProperty('isOutOfStock', false);
    });

    test('should include computed properties', () => {
      const itemData = {
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 0,
        minQuantity: 5,
        unitPrice: 99.99
      };

      const item = new InventoryItem(itemData);
      const safeObject = item.toSafeObject();

      expect(safeObject.isLowStock).toBe(false);
      expect(safeObject.isOutOfStock).toBe(true);
    });
  });

  describe('update', () => {
    test('should update allowed fields', () => {
      const item = new InventoryItem({
        name: 'Original Name',
        sku: 'TEST-001',
        quantity: 10,
        unitPrice: 50
      });

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        quantity: 20,
        unitPrice: 75,
        supplier: 'New Supplier'
      };

      item.update(updateData, 'user123');

      expect(item.name).toBe('Updated Name');
      expect(item.description).toBe('Updated description');
      expect(item.quantity).toBe(20);
      expect(item.unitPrice).toBe(75);
      expect(item.totalValue).toBe(1500);
      expect(item.supplier).toBe('New Supplier');
      expect(item.updatedBy).toBe('user123');
      expect(item.updatedAt).toBeDefined();
    });

    test('should not update disallowed fields', () => {
      const item = new InventoryItem({
        name: 'Test Item',
        sku: 'TEST-001'
      });

      const originalId = item.id;
      const originalCreatedAt = item.createdAt;

      item.update({
        id: 'new-id',
        createdAt: '2020-01-01',
        invalidField: 'should not be set'
      });

      expect(item.id).toBe(originalId);
      expect(item.createdAt).toBe(originalCreatedAt);
      expect(item.invalidField).toBeUndefined();
    });
  });

  describe('updateQuantity', () => {
    test('should update quantity and total value', () => {
      const item = new InventoryItem({
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 10,
        unitPrice: 50
      });

      item.updateQuantity(25, 'user123');

      expect(item.quantity).toBe(25);
      expect(item.totalValue).toBe(1250);
      expect(item.updatedBy).toBe('user123');
      expect(item.updatedAt).toBeDefined();
      expect(item.lastRestockedAt).toBeDefined();
    });

    test('should not allow negative quantity', () => {
      const item = new InventoryItem({
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 10
      });

      item.updateQuantity(-5);

      expect(item.quantity).toBe(0);
    });

    test('should update lastRestockedAt when quantity increases', () => {
      const item = new InventoryItem({
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 10
      });

      const originalRestockDate = item.lastRestockedAt;
      item.updateQuantity(15);

      expect(item.lastRestockedAt).not.toBe(originalRestockDate);
      expect(item.lastRestockedAt).toBeDefined();
    });

    test('should not update lastRestockedAt when quantity decreases', () => {
      const item = new InventoryItem({
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 10,
        lastRestockedAt: '2024-01-01'
      });

      const originalRestockDate = item.lastRestockedAt;
      item.updateQuantity(5);

      expect(item.lastRestockedAt).toBe(originalRestockDate);
    });
  });

  describe('addStock', () => {
    test('should add stock to current quantity', () => {
      const item = new InventoryItem({
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 10,
        unitPrice: 50
      });

      item.addStock(5, 'user123');

      expect(item.quantity).toBe(15);
      expect(item.totalValue).toBe(750);
      expect(item.updatedBy).toBe('user123');
      expect(item.lastRestockedAt).toBeDefined();
    });
  });

  describe('removeStock', () => {
    test('should remove stock from current quantity', () => {
      const item = new InventoryItem({
        name: 'Test Item',
        sku: 'TEST-001',
        quantity: 10,
        unitPrice: 50
      });

      item.removeStock(3, 'user123');

      expect(item.quantity).toBe(7);
      expect(item.totalValue).toBe(350);
      expect(item.updatedBy).toBe('user123');
    });
  });

  describe('softDelete', () => {
    test('should soft delete item', () => {
      const item = new InventoryItem({
        name: 'Test Item',
        sku: 'TEST-001'
      });

      item.softDelete('user123');

      expect(item.isActive).toBe(false);
      expect(item.status).toBe('inactive');
      expect(item.deletedAt).toBeDefined();
      expect(item.updatedBy).toBe('user123');
      expect(item.updatedAt).toBeDefined();
    });
  });

  describe('restore', () => {
    test('should restore soft deleted item', () => {
      const item = new InventoryItem({
        name: 'Test Item',
        sku: 'TEST-001'
      });

      item.softDelete('user123');
      item.restore('user456');

      expect(item.isActive).toBe(true);
      expect(item.status).toBe('active');
      expect(item.deletedAt).toBe(null);
      expect(item.updatedBy).toBe('user456');
      expect(item.updatedAt).toBeDefined();
    });
  });

  describe('Stock Status Methods', () => {
    describe('isLowStock', () => {
      test('should return true when quantity is at minimum', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 5,
          minQuantity: 5
        });

        expect(item.isLowStock()).toBe(true);
      });

      test('should return true when quantity is below minimum', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 3,
          minQuantity: 5
        });

        expect(item.isLowStock()).toBe(true);
      });

      test('should return false when quantity is above minimum', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 10,
          minQuantity: 5
        });

        expect(item.isLowStock()).toBe(false);
      });

      test('should return false when quantity is zero', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 0,
          minQuantity: 5
        });

        expect(item.isLowStock()).toBe(false);
      });
    });

    describe('isOutOfStock', () => {
      test('should return true when quantity is zero', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 0
        });

        expect(item.isOutOfStock()).toBe(true);
      });

      test('should return false when quantity is greater than zero', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 1
        });

        expect(item.isOutOfStock()).toBe(false);
      });
    });

    describe('isOverstocked', () => {
      test('should return true when quantity exceeds maximum', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 150,
          maxQuantity: 100
        });

        expect(item.isOverstocked()).toBe(true);
      });

      test('should return false when quantity is within maximum', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 50,
          maxQuantity: 100
        });

        expect(item.isOverstocked()).toBe(false);
      });

      test('should return false when no maximum is set', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 1000
        });

        expect(item.isOverstocked()).toBe(false);
      });
    });

    describe('isExpired', () => {
      test('should return true when expiry date is in the past', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          expiryDate: '2020-01-01'
        });

        expect(item.isExpired()).toBe(true);
      });

      test('should return false when expiry date is in the future', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          expiryDate: futureDate.toISOString()
        });

        expect(item.isExpired()).toBe(false);
      });

      test('should return false when no expiry date is set', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001'
        });

        expect(item.isExpired()).toBe(false);
      });
    });

    describe('getStockStatus', () => {
      test('should return out_of_stock when quantity is zero', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 0,
          minQuantity: 5
        });

        expect(item.getStockStatus()).toBe('out_of_stock');
      });

      test('should return low_stock when quantity is low', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 3,
          minQuantity: 5
        });

        expect(item.getStockStatus()).toBe('low_stock');
      });

      test('should return overstocked when quantity exceeds maximum', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 150,
          minQuantity: 5,
          maxQuantity: 100
        });

        expect(item.getStockStatus()).toBe('overstocked');
      });

      test('should return normal when quantity is within range', () => {
        const item = new InventoryItem({
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 50,
          minQuantity: 5,
          maxQuantity: 100
        });

        expect(item.getStockStatus()).toBe('normal');
      });
    });
  });

  describe('validate', () => {
    describe('Creation validation', () => {
      test('should pass validation with valid data', () => {
        const data = {
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: 10,
          unitPrice: 99.99
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should fail validation when name is missing', () => {
        const data = {
          sku: 'TEST-001'
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Name is required');
      });

      test('should fail validation when SKU is missing', () => {
        const data = {
          name: 'Test Item'
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('SKU is required');
      });

      test('should fail validation with invalid name length', () => {
        const data = {
          name: 'A',
          sku: 'TEST-001'
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Name must be between 2 and 100 characters');
      });

      test('should fail validation with invalid SKU format', () => {
        const data = {
          name: 'Test Item',
          sku: 'TEST 001!'
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('SKU can only contain letters, numbers, underscores, and hyphens');
      });

      test('should fail validation with invalid category', () => {
        const data = {
          name: 'Test Item',
          sku: 'TEST-001',
          category: 'invalid-category'
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Category must be one of: general, electronics, clothing, food, books, tools, medical, automotive');
      });

      test('should fail validation with negative quantity', () => {
        const data = {
          name: 'Test Item',
          sku: 'TEST-001',
          quantity: -5
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Quantity must be a non-negative number');
      });

      test('should fail validation when maxQuantity is less than minQuantity', () => {
        const data = {
          name: 'Test Item',
          sku: 'TEST-001',
          minQuantity: 10,
          maxQuantity: 5
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Maximum quantity must be greater than minimum quantity');
      });

      test('should fail validation with invalid status', () => {
        const data = {
          name: 'Test Item',
          sku: 'TEST-001',
          status: 'invalid-status'
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Status must be one of: active, inactive, discontinued');
      });

      test('should fail validation with invalid expiry date', () => {
        const data = {
          name: 'Test Item',
          sku: 'TEST-001',
          expiryDate: 'invalid-date'
        };

        const result = InventoryItem.validate(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Expiry date must be a valid date');
      });
    });

    describe('Update validation', () => {
      test('should pass validation for update without required fields', () => {
        const data = {
          description: 'Updated description',
          quantity: 20
        };

        const result = InventoryItem.validate(data, true);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should still validate field formats during update', () => {
        const data = {
          name: 'A',
          quantity: -5
        };

        const result = InventoryItem.validate(data, true);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Name must be between 2 and 100 characters');
        expect(result.errors).toContain('Quantity must be a non-negative number');
      });
    });
  });
});