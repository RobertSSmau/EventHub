/**
 * @file role.middleware.js
 * @description Middleware to verify user roles for protected routes.
 * @module middlewares/role
 */

/**
 * Middleware factory that checks if the authenticated user has the required role.
 *
 * @function checkRole
 * @param {string} requiredRole 
 * @returns {import('express').RequestHandler} 
 *
 * @example
 * // Example usage:
 * router.get('/admin', verifyToken, checkRole('ADMIN'), adminController.dashboard);
 */
export function checkRole(requiredRole) {
  return (req, res, next) => {
    try {
      // Ensure user data exists (populated by verifyToken)
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: user not authenticated' });
      }

      // Compare user role with required one
      if (req.user.role !== requiredRole) {
        return res.status(403).json({
          message: `Access denied: requires ${requiredRole} privileges`,
        });
      }

      next();
    } catch (err) {
      console.error('Role check error:', err.message);
      return res.status(500).json({ message: 'Role validation failed' });
    }
  };
}