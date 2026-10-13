/**
 * Re-export AuthService and middleware from the unified user module
 */
export {
  UserService,
  AuthService,
  requireAuth,
  requireSuperAdmin,
  requireWriteAccess,
  canCreateUserMiddleware as canCreateUser,
  requireRole,
  isSuperAdmin,
  isAdmin,
  isCustomer
} from '../modules/user/index.js';
