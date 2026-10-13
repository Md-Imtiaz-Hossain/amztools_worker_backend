import { Hono } from 'hono';
import { ProductService } from '../services/productService.js';
import { requireAuth, requireWriteAccess } from '../modules/user/index.js';

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
 * GET /api/products/demo
 * Returns in-memory demo products parsed from utils/demo_data.xlsx for frontend testing.
 * NEVER saves or writes test data to the actual database.
 */
productsRouter.get('/demo', async (c) => {
  try {
    const query = c.req.query();
    const result = await ProductService.getDemo(query);
    return c.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      isDemo: true
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /api/products/seed
 * (Deprecated) Seed data saving to actual DB has been removed.
 */
productsRouter.post('/seed', (c) => {
  return c.json({
    success: false,
    message: 'Saving seed data to database has been removed. Use GET /api/products/demo to test with demo_data.xlsx in-memory.'
  }, 400);
});

/**
 * GET /api/products
 * List products with pagination and keyword search for large-scale data
 */
productsRouter.get('/', async (c) => {
  try {
    const query = c.req.query();

    // If demo mode requested or DB is not configured, safely return demo data without touching DB
    if (query.demo === 'true' || !c.env.DB) {
      const result = await ProductService.getDemo(query);
      return c.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        isDemo: true
      });
    }

    const { page, limit, search, ...otherParams } = query;
    const result = await ProductService.getAll(c.env.DB, {
      page,
      limit,
      search,
      ...otherParams
    });

    return c.json({
      success: true,
      data: result.products,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalItems: result.pagination.totalItems,
        total: result.pagination.totalItems, // backwards compatibility
        totalPages: result.pagination.totalPages,
        hasPrev: result.pagination.hasPrev,
        hasNext: result.pagination.hasNext
      }
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
productsRouter.post('/', requireAuth, requireWriteAccess, async (c) => {
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
productsRouter.put('/:id', requireAuth, requireWriteAccess, async (c) => {
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
productsRouter.delete('/:id', requireAuth, requireWriteAccess, async (c) => {
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
productsRouter.post('/batch-delete', requireAuth, requireWriteAccess, async (c) => {
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
