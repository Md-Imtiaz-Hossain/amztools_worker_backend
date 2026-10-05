import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './src/routes/auth.js';
import { productsRouter } from './src/routes/products.js';
import { openApiSpec, getSwaggerHtml } from './src/docs/openapi.js';

const app = new Hono();

// Enable CORS for frontend and external calls
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400
}));

// Swagger / OpenAPI documentation routes
app.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

app.get('/docs', (c) => {
  return c.html(getSwaggerHtml('/openapi.json'));
});

app.get('/swagger', (c) => {
  return c.html(getSwaggerHtml('/openapi.json'));
});

// Mount modular sub-routers
app.route('/api/auth', authRouter);
app.route('/api/products', productsRouter);

// Root route with quick summary & link to Swagger
app.get('/', (c) => {
  return c.json({
    name: 'AMZ Tools - Product Worker API',
    status: 'online',
    version: '1.0.0',
    documentation: '/docs',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        verify: 'GET /api/auth/me'
      },
      products: {
        list: 'GET /api/products (supports ?page=&limit=20-100&search=&sortBy=&sortOrder= & col filters)',
        columns: 'GET /api/products/columns',
        getOne: 'GET /api/products/:id',
        create: 'POST /api/products (Auth required)',
        update: 'PUT /api/products/:id (Auth required)',
        delete: 'DELETE /api/products/:id (Auth required)',
        batchDelete: 'POST /api/products/batch-delete (Auth required)',
        initTable: 'POST /api/products/init-table',
        demo: 'GET /api/products/demo (Frontend test demo data from demo_data.xlsx)'
      }
    }
  });
});

// 404 Handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Endpoint not found', path: c.req.path }, 404);
});

// Global Error Handler
app.onError((err, c) => {
  console.error('Unhandled Server Error:', err);
  return c.json({ success: false, error: err.message || 'Internal Server Error' }, 500);
});

export default app;
