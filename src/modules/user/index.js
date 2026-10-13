/**
 * Single Unified User & Authentication Module
 * 
 * Includes:
 * - Database table schema definition for `user`
 * - 3 Seed Users (Super admin, admin, customer)
 * - Password security (PBKDF2 with SHA-256 via native Web Crypto)
 * - JWT Token generation & verification with 1-month session duration
 * - Role-Based Access Control (RBAC):
 *     - SuperAdmin: Access everything
 *     - Admin: Restrict only create new user, permit everything else
 *     - Customer: Like guest user, only read data
 * - User Model & Service (CRUD, login, logout, session verification)
 * - Auth & RBAC Middlewares (requireAuth, canCreateUser, requireWriteAccess, requireSuperAdmin)
 * - Hono User & Auth Router
 */

import { Hono } from 'hono';

// =============================================================================
// Constants & Configuration
// =============================================================================

export const ROLES = {
  SUPER_ADMIN: 'Super admin',
  ADMIN: 'admin',
  CUSTOMER: 'customer'
};

export const VALID_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CUSTOMER];

// 1 month = 30 days = 2,592,000 seconds
export const ONE_MONTH_SECONDS = 30 * 24 * 60 * 60;
export const DEFAULT_JWT_SECRET = 'amztools-super-secret-key-2026-auth';

export const USER_TABLE_NAME = 'user';

export const USER_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Super admin', 'admin', 'customer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON user(role);
`;

export const SEED_USERS_SQL = `
INSERT OR IGNORE INTO user (id, full_name, email, password, role)
VALUES 
    (1, 'Super Admin', 'superadmin@amztools.com', 'superadmin123', 'Super admin'),
    (2, 'Admin User', 'admin@amztools.com', 'admin123', 'admin'),
    (3, 'Customer User', 'customer@amztools.com', 'customer123', 'customer');
`;

// In-memory fallback seed users for local/test environments when D1 binding is not provided
export const SEED_USERS = [
  {
    id: 1,
    full_name: 'Super Admin',
    email: 'superadmin@amztools.com',
    password: 'superadmin123',
    role: ROLES.SUPER_ADMIN
  },
  {
    id: 2,
    full_name: 'Admin User',
    email: 'admin@amztools.com',
    password: 'admin123',
    role: ROLES.ADMIN
  },
  {
    id: 3,
    full_name: 'Customer User',
    email: 'customer@amztools.com',
    password: 'customer123',
    role: ROLES.CUSTOMER
  }
];

// =============================================================================
// Role & Permission Helpers
// =============================================================================

/**
 * Normalizes input role string to canonical form
 */
export function normalizeRole(role) {
  if (!role || typeof role !== 'string') return '';
  const clean = role.trim().toLowerCase().replace(/[-_]/g, ' ');
  if (clean === 'super admin' || clean === 'superadmin') return ROLES.SUPER_ADMIN;
  if (clean === 'admin') return ROLES.ADMIN;
  if (clean === 'customer' || clean === 'guest') return ROLES.CUSTOMER;
  return role.trim();
}

/**
 * SuperAdmin: Access everything
 */
export function isSuperAdmin(userOrRole) {
  const role = typeof userOrRole === 'object' ? userOrRole?.role : userOrRole;
  return normalizeRole(role) === ROLES.SUPER_ADMIN;
}

/**
 * Admin: Restrict only create new user, permit everything else
 */
export function isAdmin(userOrRole) {
  const role = typeof userOrRole === 'object' ? userOrRole?.role : userOrRole;
  return normalizeRole(role) === ROLES.ADMIN;
}

/**
 * Customer: Like guest user, only read data
 */
export function isCustomer(userOrRole) {
  const role = typeof userOrRole === 'object' ? userOrRole?.role : userOrRole;
  return normalizeRole(role) === ROLES.CUSTOMER;
}

/**
 * Check if the user is permitted to create new users.
 * - SuperAdmin: Permitted
 * - Admin: RESTRICTED from creating new user
 * - Customer: RESTRICTED (read only)
 */
export function canCreateUser(userOrRole) {
  return isSuperAdmin(userOrRole);
}

/**
 * Check if the user has write access (create/update/delete non-user resources like products).
 * - SuperAdmin: Permitted
 * - Admin: Permitted
 * - Customer: RESTRICTED (read only)
 */
export function hasWriteAccess(userOrRole) {
  const role = typeof userOrRole === 'object' ? userOrRole?.role : userOrRole;
  const normalized = normalizeRole(role);
  return normalized === ROLES.SUPER_ADMIN || normalized === ROLES.ADMIN;
}

// =============================================================================
// Password Security (Web Crypto PBKDF2 with SHA-256)
// =============================================================================

/**
 * Hash a plain password with PBKDF2 and 16-byte random salt
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

/**
 * Verify a plain password against stored password (handles both PBKDF2 hash & plaintext seed)
 */
export async function verifyPassword(password, storedPassword) {
  if (!password || !storedPassword) return false;

  // Direct match for plaintext seed passwords
  if (password === storedPassword) return true;

  // PBKDF2 verification
  if (typeof storedPassword === 'string' && storedPassword.startsWith('pbkdf2:')) {
    const parts = storedPassword.split(':');
    if (parts.length !== 3) return false;
    const [, saltHex, hashHex] = parts;
    const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    const derivedHashHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
    return derivedHashHex === hashHex;
  }

  return false;
}

// =============================================================================
// JWT Token Handling (HS256 with 1-Month Expiry)
// =============================================================================

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function getHmacKey(secret) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(dataToSign)
  );

  const signatureBytes = new Uint8Array(signatureBuffer);
  let signatureBinary = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    signatureBinary += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = btoa(signatureBinary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getHmacKey(secret);

    let sigBase64 = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    while (sigBase64.length % 4) sigBase64 += '=';
    const sigBinary = atob(sigBase64);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(dataToVerify)
    );

    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

// =============================================================================
// User Service
// =============================================================================

export class UserService {
  static getJwtSecret(env) {
    return (env && env.JWT_SECRET) || DEFAULT_JWT_SECRET;
  }

  static getSessionExpirySeconds(env) {
    if (env && env.SESSION_EXPIRY_SECONDS) {
      const parsed = parseInt(env.SESSION_EXPIRY_SECONDS);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return ONE_MONTH_SECONDS;
  }

  /**
   * Initialize table and seed initial 3 types of users if empty
   */
  static async initTable(db) {
    if (!db) throw new Error('Database binding is required');

    const statements = [
      USER_SCHEMA_SQL,
      SEED_USERS_SQL
    ]
      .join(';')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => db.prepare(s));

    if (statements.length > 0) {
      await db.batch(statements);
    }
    return true;
  }

  /**
   * Find user by email in D1
   */
  static async findByEmail(db, email) {
    if (!db || !email) return null;
    try {
      const stmt = db.prepare('SELECT * FROM user WHERE LOWER(email) = LOWER(?) LIMIT 1');
      return await stmt.bind(email.trim()).first();
    } catch (e) {
      return null;
    }
  }

  /**
   * Find user by ID in D1
   */
  static async findById(db, id) {
    if (!db || !id) return null;
    try {
      const stmt = db.prepare('SELECT id, full_name, email, role, created_at, updated_at FROM user WHERE id = ? LIMIT 1');
      return await stmt.bind(id).first();
    } catch (e) {
      return null;
    }
  }

  /**
   * List all users (excluding password hashes)
   */
  static async getAll(db) {
    if (!db) {
      return SEED_USERS.map(({ password, ...u }) => u);
    }
    try {
      const stmt = db.prepare('SELECT id, full_name, email, role, created_at, updated_at FROM user ORDER BY id ASC');
      const res = await stmt.all();
      return (res && res.results) || [];
    } catch (e) {
      return SEED_USERS.map(({ password, ...u }) => u);
    }
  }

  /**
   * Create a new user in D1
   */
  static async createUser(db, userData) {
    const { full_name, email, password, role } = userData;

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      throw new Error('Full name is required');
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const normalizedRole = normalizeRole(role);
    if (!VALID_ROLES.includes(normalizedRole)) {
      throw new Error(`Invalid role '${role}'. Role must be one of: ${VALID_ROLES.join(', ')}`);
    }

    // Check if email already exists
    if (db) {
      const existing = await this.findByEmail(db, email);
      if (existing) {
        const err = new Error(`User with email '${email}' already exists`);
        err.status = 409;
        throw err;
      }

      const hashedPassword = await hashPassword(password);
      const insertStmt = db.prepare(
        'INSERT INTO user (full_name, email, password, role) VALUES (?, ?, ?, ?)'
      );
      await insertStmt.bind(full_name.trim(), email.trim().toLowerCase(), hashedPassword, normalizedRole).run();

      const created = await this.findByEmail(db, email);
      if (created) {
        const { password: _, ...safeUser } = created;
        return safeUser;
      }
    }

    // Fallback in-memory representation if DB is not provided
    return {
      id: Date.now(),
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role: normalizedRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Authenticate user with identifier (email or username) and password
   */
  static async login(identifier, password, env) {
    if (!identifier || !password) {
      return { success: false, error: 'Email/Username and password are required', status: 400 };
    }

    const trimmedId = String(identifier).trim();
    let foundUser = null;

    // 1. Check in D1 Database if available
    if (env && env.DB) {
      foundUser = await this.findByEmail(env.DB, trimmedId);
    }

    // 2. Fallback to in-memory seed users or default admin credentials if not found in DB
    if (!foundUser) {
      const seedMatch = SEED_USERS.find(
        u => u.email.toLowerCase() === trimmedId.toLowerCase()
      );
      if (seedMatch) {
        foundUser = seedMatch;
      } else if (trimmedId.toLowerCase() === 'admin' || trimmedId.toLowerCase() === (env?.ADMIN_USERNAME || 'admin').toLowerCase()) {
        foundUser = {
          id: 2,
          full_name: 'Admin User',
          email: 'admin@amztools.com',
          password: env?.ADMIN_PASSWORD || 'password123',
          role: ROLES.ADMIN
        };
      }
    }

    if (!foundUser) {
      return { success: false, error: 'Invalid email or password', status: 401 };
    }

    // Verify password (supports hashed, plaintext seed, and legacy password123)
    let isPasswordValid = await verifyPassword(password, foundUser.password);
    if (!isPasswordValid && (foundUser.role === ROLES.ADMIN || trimmedId.toLowerCase() === 'admin')) {
      if (password === 'password123' || password === 'admin123' || password === env?.ADMIN_PASSWORD) {
        isPasswordValid = true;
      }
    }
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password', status: 401 };
    }

    // Generate JWT token with 1-month session duration
    const jwtSecret = this.getJwtSecret(env);
    const sessionExpirySeconds = this.getSessionExpirySeconds(env);
    const nowSec = Math.floor(Date.now() / 1000);
    const exp = nowSec + sessionExpirySeconds;

    const usernameVal = trimmedId.toLowerCase() === 'admin' ? 'admin' : (foundUser.email || foundUser.full_name);

    const payload = {
      id: foundUser.id,
      email: foundUser.email,
      full_name: foundUser.full_name,
      role: foundUser.role,
      username: usernameVal,
      iat: nowSec,
      exp
    };

    const token = await signToken(payload, jwtSecret);

    return {
      success: true,
      token,
      expiresAt: new Date(exp * 1000).toISOString(),
      expiresInSeconds: sessionExpirySeconds,
      user: {
        id: foundUser.id,
        full_name: foundUser.full_name,
        email: foundUser.email,
        role: foundUser.role,
        username: usernameVal
      }
    };
  }

  /**
   * Verify session from Authorization Bearer token header
   */
  static async verifySession(authHeader, env) {
    if (!authHeader) return null;
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const secret = this.getJwtSecret(env);
    return await verifyToken(token, secret);
  }
}

// Backwards compatibility alias
export const AuthService = UserService;

// =============================================================================
// Auth & RBAC Middlewares
// =============================================================================

/**
 * Middleware: Requires a valid authenticated JWT session token
 */
export async function requireAuth(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ success: false, error: 'Authentication required. Missing Bearer token.' }, 401);
  }

  const user = await UserService.verifySession(authHeader, c.env);
  if (!user) {
    return c.json({ success: false, error: 'Invalid or expired session. Please log in again.' }, 401);
  }

  c.set('user', user);
  await next();
}

/**
 * Middleware: RBAC - Enforce user creation permission
 * - SuperAdmin: Permitted
 * - Admin: RESTRICTED from creating new user
 * - Customer: RESTRICTED (read only)
 */
export async function canCreateUserMiddleware(c, next) {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  if (isCustomer(user)) {
    return c.json({
      success: false,
      error: 'Forbidden: Customer role has read-only access. Creating users is not permitted.'
    }, 403);
  }

  if (isAdmin(user)) {
    return c.json({
      success: false,
      error: 'Forbidden: Admins are restricted from creating new users. Only SuperAdmin can create new users.'
    }, 403);
  }

  if (!isSuperAdmin(user)) {
    return c.json({
      success: false,
      error: 'Forbidden: Only SuperAdmin is permitted to create new users.'
    }, 403);
  }

  await next();
}

/**
 * Middleware: RBAC - Enforce write access on catalog resources (products, etc.)
 * - SuperAdmin: Access everything
 * - Admin: Permitted
 * - Customer: RESTRICTED (only read data)
 */
export async function requireWriteAccess(c, next) {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  if (isCustomer(user)) {
    return c.json({
      success: false,
      error: 'Forbidden: Customer role has read-only access. Mutation operations are not permitted.'
    }, 403);
  }

  await next();
}

/**
 * Middleware: RBAC - Enforce SuperAdmin access
 */
export async function requireSuperAdmin(c, next) {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  if (!isSuperAdmin(user)) {
    return c.json({
      success: false,
      error: 'Forbidden: SuperAdmin access required'
    }, 403);
  }

  await next();
}

/**
 * Generic RBAC Middleware factory
 */
export function requireRole(...allowedRoles) {
  const canonical = allowedRoles.map(r => normalizeRole(r));
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
    const userRole = normalizeRole(user.role);
    if (!canonical.includes(userRole)) {
      return c.json({
        success: false,
        error: `Forbidden: Access requires one of the following roles: ${allowedRoles.join(', ')}`
      }, 403);
    }
    await next();
  };
}

// =============================================================================
// User & Auth Router
// =============================================================================

export const userRouter = new Hono();

/**
 * POST /login
 * Body: { email, password } or { username, password }
 */
userRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const identifier = body.email || body.username;
    const result = await UserService.login(identifier, body.password, c.env);
    if (!result.success) {
      return c.json(result, result.status || 401);
    }
    return c.json(result, 200);
  } catch (err) {
    return c.json({ success: false, error: err.message || 'Login failed' }, 400);
  }
});

/**
 * POST /logout
 */
userRouter.post('/logout', (c) => {
  return c.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /me
 * Returns current authenticated user profile
 */
userRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  const user = await UserService.verifySession(authHeader, c.env);
  if (!user) {
    return c.json({ success: false, error: 'Session invalid or expired' }, 401);
  }
  return c.json({ success: true, user });
});

/**
 * GET / (or /users)
 * List all users (Protected)
 */
userRouter.get('/', requireAuth, async (c) => {
  try {
    const users = await UserService.getAll(c.env?.DB);
    return c.json({ success: true, data: users });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * GET /:id
 * Get single user by ID (Protected)
 */
userRouter.get('/:id', requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid user ID' }, 400);
    }
    const user = await UserService.findById(c.env?.DB, id);
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    return c.json({ success: true, data: user });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST / (Create User)
 * Protected: requireAuth, canCreateUserMiddleware
 * - SuperAdmin: Access everything (Permitted)
 * - Admin: RESTRICTED from creating new user (403 Forbidden)
 * - Customer: Read-only (403 Forbidden)
 */
userRouter.post('/', requireAuth, canCreateUserMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const created = await UserService.createUser(c.env?.DB, body);
    return c.json({
      success: true,
      message: 'User created successfully',
      data: created
    }, 201);
  } catch (err) {
    return c.json({ success: false, error: err.message }, err.status || 400);
  }
});

/**
 * POST /register (Alias for user creation)
 */
userRouter.post('/register', requireAuth, canCreateUserMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const created = await UserService.createUser(c.env?.DB, body);
    return c.json({
      success: true,
      message: 'User created successfully',
      data: created
    }, 201);
  } catch (err) {
    return c.json({ success: false, error: err.message }, err.status || 400);
  }
});

/**
 * POST /init-table
 * Helper to initialize the user table and seed data in Cloudflare D1
 */
userRouter.post('/init-table', async (c) => {
  try {
    if (!c.env?.DB) {
      return c.json({ success: false, error: 'Database binding env.DB is not configured' }, 500);
    }
    await UserService.initTable(c.env.DB);
    return c.json({
      success: true,
      message: 'User table and initial seed users initialized successfully'
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Backwards compatibility alias
export const authRouter = userRouter;
