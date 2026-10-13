/**
 * Re-export auth utilities from the unified user module
 */
export {
  signToken,
  verifyToken,
  hashPassword,
  verifyPassword
} from '../modules/user/index.js';
