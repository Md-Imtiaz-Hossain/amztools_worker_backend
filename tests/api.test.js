import { describe, it } from 'node:test';
import assert from 'node:assert';
import app from '../index.js';
import { AUTH_CONFIG } from '../src/config.js';

describe('AMZ Tools Worker Backend Tests', () => {
  it('GET / should return online status and endpoint map', async () => {
    const res = await app.request('/');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'online');
    assert.ok(body.documentation);
  });

  it('GET /openapi.json should return valid OpenAPI 3.0 specification', async () => {
    const res = await app.request('/openapi.json');
    assert.strictEqual(res.status, 200);
    const spec = await res.json();
    assert.strictEqual(spec.openapi, '3.0.3');
    assert.ok(spec.paths['/api/products']);
    assert.ok(spec.paths['/api/auth/login']);
  });

  it('GET /docs should return Swagger UI HTML', async () => {
    const res = await app.request('/docs');
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('SwaggerUIBundle'));
  });

  it('GET /api/products/columns should return all 67 columns metadata', async () => {
    const res = await app.request('/api/products/columns');
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.length, 67);
    const asinCol = body.data.find(c => c.key === 'asin');
    assert.ok(asinCol);
    assert.strictEqual(asinCol.label, 'ASIN');
  });

  it('POST /api/auth/login should fail with invalid credentials', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  it('POST /api/auth/login should succeed with valid credentials and return 1-week session token', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: AUTH_CONFIG.username, password: AUTH_CONFIG.password })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.token);
    assert.strictEqual(body.expiresInSeconds, 7 * 24 * 3600);

    // Verify token with /api/auth/me
    const meRes = await app.request('/api/auth/me', {
      headers: { Authorization: `Bearer ${body.token}` }
    });
    assert.strictEqual(meRes.status, 200);
    const meBody = await meRes.json();
    assert.strictEqual(meBody.success, true);
    assert.strictEqual(meBody.user.username, AUTH_CONFIG.username);
  });

  it('Protected endpoints without token should return 401', async () => {
    const res = await app.request('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asin: 'B012345678', wholesaler_company_name: 'Test' })
    });
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/products should extract page, limit, search and return structured data with pagination metadata', async () => {
    const executedQueries = [];
    const mockDb = {
      prepare(sql) {
        return {
          bind(...params) {
            executedQueries.push({ sql, params });
            return {
              async first() {
                if (sql.includes('COUNT(*)')) {
                  return { total: 45 };
                }
                return null;
              },
              async all() {
                return {
                  results: [
                    { id: 1, title: 'Outdoor Camera', about_this_item: 'HD video resolution', asin: 'B001' }
                  ]
                };
              }
            };
          },
          async first() {
            executedQueries.push({ sql, params: [] });
            if (sql.includes('COUNT(*)')) {
              return { total: 45 };
            }
            return null;
          }
        };
      }
    };

    const res = await app.request('/api/products?page=2&limit=15&search=camera', {}, { DB: mockDb });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.strictEqual(body.data.length, 1);

    // Verify pagination metadata structure
    assert.ok(body.pagination);
    assert.strictEqual(body.pagination.page, 2);
    assert.strictEqual(body.pagination.limit, 15);
    assert.strictEqual(body.pagination.totalItems, 45);
    assert.strictEqual(body.pagination.totalPages, 3);
    assert.strictEqual(body.pagination.hasPrev, true);
    assert.strictEqual(body.pagination.hasNext, true);

    // Verify search LIKE query on title or about_this_item was executed
    const countQuery = executedQueries.find(q => q.sql.includes('COUNT(*)'));
    assert.ok(countQuery, 'COUNT query must be executed');
    assert.ok(countQuery.sql.includes('title LIKE ? OR about_this_item LIKE ?'));
    assert.deepStrictEqual(countQuery.params, ['%camera%', '%camera%']);

    // Verify LIMIT and OFFSET parameters applied: page 2, limit 15 -> LIMIT 15 OFFSET 15
    const dataQuery = executedQueries.find(q => q.sql.includes('SELECT * FROM'));
    assert.ok(dataQuery, 'Data query must be executed');
    assert.ok(dataQuery.sql.includes('LIMIT ? OFFSET ?'));
    assert.strictEqual(dataQuery.params[dataQuery.params.length - 2], 15);
    assert.strictEqual(dataQuery.params[dataQuery.params.length - 1], 15);
  });

  it('ProductService.getAll should enforce default page=1, default limit=20, and cap limit at 100', async () => {
    const executedQueries = [];
    const mockDb = {
      prepare(sql) {
        return {
          bind(...params) {
            executedQueries.push({ sql, params });
            return {
              async first() { return { total: 10000000 }; },
              async all() { return { results: [] }; }
            };
          },
          async first() {
            executedQueries.push({ sql, params: [] });
            return { total: 10000000 };
          }
        };
      }
    };

    const { ProductService } = await import('../src/services/productService.js');

    // Test default limit (20) and page (1)
    const result1 = await ProductService.getAll(mockDb, {});
    assert.strictEqual(result1.pagination.page, 1);
    assert.strictEqual(result1.pagination.limit, 20);
    assert.strictEqual(result1.pagination.totalItems, 10000000);
    assert.strictEqual(result1.pagination.totalPages, 500000);

    // Test max limit cap (request 500 -> capped at 100)
    const result2 = await ProductService.getAll(mockDb, { limit: 500, page: 5 });
    assert.strictEqual(result2.pagination.page, 5);
    assert.strictEqual(result2.pagination.limit, 100);
    assert.strictEqual(result2.pagination.totalItems, 10000000);
    assert.strictEqual(result2.pagination.totalPages, 100000);
  });
});
