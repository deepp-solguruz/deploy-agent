/**
 * Inventory validation middleware
 */

// Validate inventory item creation
const validateInventoryCreate = (req, res, next) => {
  const { name, sku, category, quantity, minQuantity, maxQuantity, unitPrice } = req.body;
  const errors = [];

  // Required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  } else if (name.length < 2 || name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
    errors.push('SKU is required and must be a non-empty string');
  } else if (sku.length < 2 || sku.length > 50) {
    errors.push('SKU must be between 2 and 50 characters');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(sku)) {
    errors.push('SKU can only contain letters, numbers, underscores, and hyphens');
  }

  // Optional fields validation
  if (req.body.description !== undefined && typeof req.body.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (category !== undefined) {
    const validCategories = ['general', 'electronics', 'clothing', 'food', 'books', 'tools', 'medical', 'automotive'];
    if (!validCategories.includes(category)) {
      errors.push('Category must be one of: ' + validCategories.join(', '));
    }
  }

  if (quantity !== undefined) {
    if (typeof quantity !== 'number' || quantity < 0) {
      errors.push('Quantity must be a non-negative number');
    }
  }

  if (minQuantity !== undefined) {
    if (typeof minQuantity !== 'number' || minQuantity < 0) {
      errors.push('Minimum quantity must be a non-negative number');
    }
  }

  if (maxQuantity !== undefined && maxQuantity !== null) {
    if (typeof maxQuantity !== 'number' || maxQuantity < 0) {
      errors.push('Maximum quantity must be a non-negative number');
    }
    if (minQuantity !== undefined && maxQuantity < minQuantity) {
      errors.push('Maximum quantity must be greater than minimum quantity');
    }
  }

  if (unitPrice !== undefined) {
    if (typeof unitPrice !== 'number' || unitPrice < 0) {
      errors.push('Unit price must be a non-negative number');
    }
  }

  if (req.body.status !== undefined) {
    const validStatuses = ['active', 'inactive', 'discontinued'];
    if (!validStatuses.includes(req.body.status)) {
      errors.push('Status must be one of: ' + validStatuses.join(', '));
    }
  }

  if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  if (req.body.supplier !== undefined && typeof req.body.supplier !== 'string') {
    errors.push('Supplier must be a string');
  }

  if (req.body.location !== undefined && typeof req.body.location !== 'string') {
    errors.push('Location must be a string');
  }

  if (req.body.expiryDate !== undefined && req.body.expiryDate !== null) {
    const expiryDate = new Date(req.body.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Expiry date must be a valid date');
    }
  }

  if (req.body.batchNumber !== undefined && typeof req.body.batchNumber !== 'string') {
    errors.push('Batch number must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided data',
      details: errors
    });
  }

  next();
};

// Validate inventory item update
const validateInventoryUpdate = (req, res, next) => {
  const errors = [];

  // Only validate fields that are present in the request
  if (req.body.name !== undefined) {
    if (typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
      errors.push('Name must be a non-empty string');
    } else if (req.body.name.length < 2 || req.body.name.length > 100) {
      errors.push('Name must be between 2 and 100 characters');
    }
  }

  if (req.body.sku !== undefined) {
    if (typeof req.body.sku !== 'string' || req.body.sku.trim().length === 0) {
      errors.push('SKU must be a non-empty string');
    } else if (req.body.sku.length < 2 || req.body.sku.length > 50) {
      errors.push('SKU must be between 2 and 50 characters');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(req.body.sku)) {
      errors.push('SKU can only contain letters, numbers, underscores, and hyphens');
    }
  }

  if (req.body.description !== undefined && typeof req.body.description !== 'string') {
    errors.push('Description must be a string');
  }

  if (req.body.category !== undefined) {
    const validCategories = ['general', 'electronics', 'clothing', 'food', 'books', 'tools', 'medical', 'automotive'];
    if (!validCategories.includes(req.body.category)) {
      errors.push('Category must be one of: ' + validCategories.join(', '));
    }
  }

  if (req.body.quantity !== undefined) {
    if (typeof req.body.quantity !== 'number' || req.body.quantity < 0) {
      errors.push('Quantity must be a non-negative number');
    }
  }

  if (req.body.minQuantity !== undefined) {
    if (typeof req.body.minQuantity !== 'number' || req.body.minQuantity < 0) {
      errors.push('Minimum quantity must be a non-negative number');
    }
  }

  if (req.body.maxQuantity !== undefined && req.body.maxQuantity !== null) {
    if (typeof req.body.maxQuantity !== 'number' || req.body.maxQuantity < 0) {
      errors.push('Maximum quantity must be a non-negative number');
    }
  }

  if (req.body.unitPrice !== undefined) {
    if (typeof req.body.unitPrice !== 'number' || req.body.unitPrice < 0) {
      errors.push('Unit price must be a non-negative number');
    }
  }

  if (req.body.status !== undefined) {
    const validStatuses = ['active', 'inactive', 'discontinued'];
    if (!validStatuses.includes(req.body.status)) {
      errors.push('Status must be one of: ' + validStatuses.join(', '));
    }
  }

  if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  if (req.body.supplier !== undefined && typeof req.body.supplier !== 'string') {
    errors.push('Supplier must be a string');
  }

  if (req.body.location !== undefined && typeof req.body.location !== 'string') {
    errors.push('Location must be a string');
  }

  if (req.body.expiryDate !== undefined && req.body.expiryDate !== null) {
    const expiryDate = new Date(req.body.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Expiry date must be a valid date');
    }
  }

  if (req.body.batchNumber !== undefined && typeof req.body.batchNumber !== 'string') {
    errors.push('Batch number must be a string');
  }

  // Cross-field validation
  if (req.body.minQuantity !== undefined && req.body.maxQuantity !== undefined && req.body.maxQuantity !== null) {
    if (req.body.maxQuantity < req.body.minQuantity) {
      errors.push('Maximum quantity must be greater than minimum quantity');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided data',
      details: errors
    });
  }

  next();
};

// Validate quantity update
const validateQuantityUpdate = (req, res, next) => {
  const { quantity } = req.body;
  const errors = [];

  if (quantity === undefined) {
    errors.push('Quantity is required');
  } else if (typeof quantity !== 'number' || quantity < 0) {
    errors.push('Quantity must be a non-negative number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided data',
      details: errors
    });
  }

  next();
};

// Validate stock adjustment
const validateStockAdjustment = (req, res, next) => {
  const { amount } = req.body;
  const errors = [];

  if (amount === undefined) {
    errors.push('Amount is required');
  } else if (typeof amount !== 'number' || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided data',
      details: errors
    });
  }

  next();
};

// Validate search parameters
const validateSearch = (req, res, next) => {
  const { query } = req.params;
  const errors = [];

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    errors.push('Search query must be at least 2 characters long');
  }

  // Validate query parameters
  if (req.query.page !== undefined) {
    const page = parseInt(req.query.page);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (req.query.limit !== undefined) {
    const limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided parameters',
      details: errors
    });
  }

  next();
};

// Validate filter parameters
const validateFilters = (req, res, next) => {
  const errors = [];

  if (req.query.category !== undefined) {
    const validCategories = ['general', 'electronics', 'clothing', 'food', 'books', 'tools', 'medical', 'automotive'];
    if (!validCategories.includes(req.query.category)) {
      errors.push('Category must be one of: ' + validCategories.join(', '));
    }
  }

  if (req.query.status !== undefined) {
    const validStatuses = ['active', 'inactive', 'discontinued'];
    if (!validStatuses.includes(req.query.status)) {
      errors.push('Status must be one of: ' + validStatuses.join(', '));
    }
  }

  if (req.query.isActive !== undefined) {
    if (req.query.isActive !== 'true' && req.query.isActive !== 'false') {
      errors.push('isActive must be "true" or "false"');
    }
  }

  if (req.query.lowStock !== undefined) {
    if (req.query.lowStock !== 'true' && req.query.lowStock !== 'false') {
      errors.push('lowStock must be "true" or "false"');
    }
  }

  if (req.query.outOfStock !== undefined) {
    if (req.query.outOfStock !== 'true' && req.query.outOfStock !== 'false') {
      errors.push('outOfStock must be "true" or "false"');
    }
  }

  if (req.query.page !== undefined) {
    const page = parseInt(req.query.page);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (req.query.limit !== undefined) {
    const limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided parameters',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateInventoryCreate,
  validateInventoryUpdate,
  validateQuantityUpdate,
  validateStockAdjustment,
  validateSearch,
  validateFilters
};