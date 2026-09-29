import { AUTH_CONFIG } from '../config.js';
import { signToken, verifyToken } from '../utils/auth.js';

export class AuthService {
  static getCredentials(env) {
    return {
      username: (env && env.ADMIN_USERNAME) || AUTH_CONFIG.username,
      password: (env && env.ADMIN_PASSWORD) || AUTH_CONFIG.password,
      jwtSecret: (env && env.JWT_SECRET) || AUTH_CONFIG.jwtSecret,
      sessionExpirySeconds: AUTH_CONFIG.sessionExpirySeconds
    };
  }

  static async login(username, password, env) {
    const creds = this.getCredentials(env);
    if (!username || !password) {
      return { success: false, error: 'Username and password are required', status: 400 };
    }

    if (username !== creds.username || password !== creds.password) {
      return { success: false, error: 'Invalid username or password', status: 401 };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const exp = nowSec + creds.sessionExpirySeconds; // 7 days (1 week)
    const payload = {
      username,
      iat: nowSec,
      exp
    };

    const token = await signToken(payload, creds.jwtSecret);

    return {
      success: true,
      token,
      expiresAt: new Date(exp * 1000).toISOString(),
      expiresInSeconds: creds.sessionExpirySeconds,
      user: { username }
    };
  }

  static async verifySession(authHeader, env) {
    if (!authHeader) return null;
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const creds = this.getCredentials(env);
    return await verifyToken(token, creds.jwtSecret);
  }
}

/**
 * Hono Middleware to require authentication on protected endpoints
 */
export async function requireAuth(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ success: false, error: 'Authentication required. Missing Bearer token.' }, 401);
  }

  const user = await AuthService.verifySession(authHeader, c.env);
  if (!user) {
    return c.json({ success: false, error: 'Invalid or expired session. Please log in again.' }, 401);
  }

  c.set('user', user);
  await next();
}
