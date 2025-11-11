/**
 * @file role.middleware.js
 * @description Middleware to verify user roles for protected routes.
 * @module middlewares/role
 */

// Check if user has required role
export function checkRole(requiredRole) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: user not authenticated' });
      }

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

// Admin role check shortcut
export const isAdmin = checkRole('ADMIN');