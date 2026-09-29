import { Hono } from 'hono';
import { ProductService } from '../services/productService.js';
import { requireAuth } from '../services/authService.js';

export const productsRouter = new Hono();

/**
 * GET /api/products/columns
 * Returns metadata of all table columns (types, labels, default visibility)
 */
productsRouter.get('/columns', (c) => {
  return c.json({
    success: true,
    data: ProductService.getColumns()
  });
});

/**
 * POST /api/products/init-table
 * Helper to initialize the wholesale_products table and indexes on D1
 */
productsRouter.post('/init-table', async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ success: false, error: 'Database binding env.DB is not configured' }, 500);
    }
    await ProductService.initTable(c.env.DB);
    return c.json({ success: true, message: 'Table wholesale_products and indexes initialized successfully' });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * GET /api/products
 * List products with pagination, sorting, search, and per-column filters
 */
productsRouter.get('/', async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ success: false, error: 'Database binding env.DB is not configured' }, 500);
    }
    const query = c.req.query();
    const result = await ProductService.listProducts(c.env.DB, query);
    return c.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
productsRouter.get('/:id', async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ success: false, error: 'Database binding env.DB is not configured' }, 500);
    }
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid product ID' }, 400);
    }

    const product = await ProductService.getProductById(c.env.DB, id);
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    return c.json({ success: true, data: product });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /api/products
 * Create a new product (Protected: Requires Bearer Auth)
 */
productsRouter.post('/', requireAuth, async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ success: false, error: 'Database binding env.DB is not configured' }, 500);
    }
    const body = await c.req.json();
    const created = await ProductService.createProduct(c.env.DB, body);
    return c.json({
      success: true,
      message: 'Product created successfully',
      data: created
    }, 201);
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/**
 * PUT /api/products/:id
 * Update an existing product (Protected: Requires Bearer Auth)
 */
productsRouter.put('/:id', requireAuth, async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ success: false, error: 'Database binding env.DB is not configured' }, 500);
    }
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid product ID' }, 400);
    }

    const body = await c.req.json();
    const updated = await ProductService.updateProduct(c.env.DB, id, body);
    if (!updated) {
      return c.json({ success: false, error: 'Product not found or update failed' }, 404);
    }

    return c.json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product by ID (Protected: Requires Bearer Auth)
 */
productsRouter.delete('/:id', requireAuth, async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ success: false, error: 'Database binding env.DB is not configured' }, 500);
    }
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid product ID' }, 400);
    }

    const deleted = await ProductService.deleteProduct(c.env.DB, id);
    if (!deleted) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }

    return c.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /api/products/batch-delete
 * Delete multiple products by IDs (Protected: Requires Bearer Auth)
 */
productsRouter.post('/batch-delete', requireAuth, async (c) => {
  try {
    if (!c.env.DB) {
      return c.json({ success: false, error: 'Database binding env.DB is not configured' }, 500);
    }
    const body = await c.req.json();
    const count = await ProductService.batchDelete(c.env.DB, body.ids);
    return c.json({ success: true, message: `Successfully deleted ${count} products`, count });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});
