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
});
