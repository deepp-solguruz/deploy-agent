const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  validateInventoryCreate,
  validateInventoryUpdate,
  validateQuantityUpdate,
  validateStockAdjustment,
  validateSearch,
  validateFilters
} = require('../validators/inventory');
const inventoryService = require('../services/InventoryService');

const router = express.Router();

// Get all inventory items with filtering and pagination
router.get('/', authenticateToken, validateFilters, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      lowStock: req.query.lowStock === 'true',
      outOfStock: req.query.outOfStock === 'true',
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await inventoryService.getAllItems(filters);

    res.json({
      message: 'Inventory items retrieved successfully',
      data: result.items,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({
      error: 'Failed to retrieve inventory items',
      message: error.message
    });
  }
});

// Get inventory summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const summary = await inventoryService.getInventorySummary();

    res.json({
      message: 'Inventory summary retrieved successfully',
      data: summary
    });

  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({
      error: 'Failed to retrieve inventory summary',
      message: error.message
    });
  }
});

// Get low stock items
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    const items = await inventoryService.getLowStockItems();

    res.json({
      message: 'Low stock items retrieved successfully',
      data: items,
      count: items.length
    });

  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      error: 'Failed to retrieve low stock items',
      message: error.message
    });
  }
});

// Get out of stock items
router.get('/out-of-stock', authenticateToken, async (req, res) => {
  try {
    const items = await inventoryService.getOutOfStockItems();

    res.json({
      message: 'Out of stock items retrieved successfully',
      data: items,
      count: items.length
    });

  } catch (error) {
    console.error('Get out of stock items error:', error);
    res.status(500).json({
      error: 'Failed to retrieve out of stock items',
      message: error.message
    });
  }
});

// Search inventory items
router.get('/search/:query', authenticateToken, validateSearch, async (req, res) => {
  try {
    const { query } = req.params;
    const options = {
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await inventoryService.searchItems(query, options);

    res.json({
      message: 'Search completed successfully',
      data: result.items,
      query: result.query,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Search inventory items error:', error);
    res.status(400).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// Get item by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await inventoryService.getItemById(id);

    res.json({
      message: 'Inventory item retrieved successfully',
      data: item
    });

  } catch (error) {
    console.error('Get inventory item error:', error);
    const statusCode = error.message === 'Item not found' ? 404 : 500;
    res.status(statusCode).json({
      error: 'Failed to retrieve inventory item',
      message: error.message
    });
  }
});

// Get item by SKU
router.get('/sku/:sku', authenticateToken, async (req, res) => {
  try {
    const { sku } = req.params;
    const item = await inventoryService.getItemBySku(sku);

    res.json({
      message: 'Inventory item retrieved successfully',
      data: item
    });

  } catch (error) {
    console.error('Get inventory item by SKU error:', error);
    const statusCode = error.message === 'Item not found' ? 404 : 500;
    res.status(statusCode).json({
      error: 'Failed to retrieve inventory item',
      message: error.message
    });
  }
});

// Create new inventory item
router.post('/', authenticateToken, validateInventoryCreate, async (req, res) => {
  try {
    const itemData = req.body;
    const createdBy = req.user.id;

    const item = await inventoryService.createItem(itemData, createdBy);

    res.status(201).json({
      message: 'Inventory item created successfully',
      data: item
    });

  } catch (error) {
    console.error('Create inventory item error:', error);
    const statusCode = error.message.includes('SKU already exists') ? 409 : 
                      error.message.includes('Validation failed') ? 400 : 500;
    res.status(statusCode).json({
      error: 'Failed to create inventory item',
      message: error.message
    });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, validateInventoryUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedBy = req.user.id;

    const item = await inventoryService.updateItem(id, updateData, updatedBy);

    res.json({
      message: 'Inventory item updated successfully',
      data: item
    });

  } catch (error) {
    console.error('Update inventory item error:', error);
    const statusCode = error.message === 'Item not found' ? 404 :
                      error.message.includes('SKU already exists') ? 409 :
                      error.message.includes('Validation failed') ? 400 : 500;
    res.status(statusCode).json({
      error: 'Failed to update inventory item',
      message: error.message
    });
  }
});

// Update item quantity
router.patch('/:id/quantity', authenticateToken, validateQuantityUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const updatedBy = req.user.id;

    const item = await inventoryService.updateQuantity(id, quantity, updatedBy);

    res.json({
      message: 'Item quantity updated successfully',
      data: item
    });

  } catch (error) {
    console.error('Update quantity error:', error);
    const statusCode = error.message === 'Item not found' ? 404 : 400;
    res.status(statusCode).json({
      error: 'Failed to update quantity',
      message: error.message
    });
  }
});

// Add stock
router.patch('/:id/add-stock', authenticateToken, validateStockAdjustment, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const updatedBy = req.user.id;

    const item = await inventoryService.addStock(id, amount, updatedBy);

    res.json({
      message: 'Stock added successfully',
      data: item
    });

  } catch (error) {
    console.error('Add stock error:', error);
    const statusCode = error.message === 'Item not found' ? 404 : 400;
    res.status(statusCode).json({
      error: 'Failed to add stock',
      message: error.message
    });
  }
});

// Remove stock
router.patch('/:id/remove-stock', authenticateToken, validateStockAdjustment, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const updatedBy = req.user.id;

    const item = await inventoryService.removeStock(id, amount, updatedBy);

    res.json({
      message: 'Stock removed successfully',
      data: item
    });

  } catch (error) {
    console.error('Remove stock error:', error);
    const statusCode = error.message === 'Item not found' ? 404 :
                      error.message === 'Insufficient stock' ? 400 : 400;
    res.status(statusCode).json({
      error: 'Failed to remove stock',
      message: error.message
    });
  }
});

// Delete inventory item (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.user.id;

    const item = await inventoryService.deleteItem(id, deletedBy);

    res.json({
      message: 'Inventory item deleted successfully',
      data: item
    });

  } catch (error) {
    console.error('Delete inventory item error:', error);
    const statusCode = error.message === 'Item not found' ? 404 : 500;
    res.status(statusCode).json({
      error: 'Failed to delete inventory item',
      message: error.message
    });
  }
});

// Restore inventory item
router.patch('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const restoredBy = req.user.id;

    const item = await inventoryService.restoreItem(id, restoredBy);

    res.json({
      message: 'Inventory item restored successfully',
      data: item
    });

  } catch (error) {
    console.error('Restore inventory item error:', error);
    const statusCode = error.message === 'Item not found' ? 404 : 500;
    res.status(statusCode).json({
      error: 'Failed to restore inventory item',
      message: error.message
    });
  }
});

module.exports = router;