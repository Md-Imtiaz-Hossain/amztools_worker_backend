import { Hono } from 'hono';
import { AuthService } from '../services/authService.js';

export const authRouter = new Hono();

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const result = await AuthService.login(body.username, body.password, c.env);
    if (!result.success) {
      return c.json(result, result.status || 401);
    }
    return c.json(result, 200);
  } catch (err) {
    return c.json({ success: false, error: err.message || 'Login failed' }, 400);
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', (c) => {
  return c.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
authRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await AuthService.verifySession(authHeader, c.env);
  if (!user) {
    return c.json({ success: false, error: 'Session invalid or expired' }, 401);
  }
  return c.json({ success: true, user });
});
