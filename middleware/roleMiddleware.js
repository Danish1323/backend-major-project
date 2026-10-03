// Middleware factory for Role-Based Access Control (RBAC)
// Usage: authorizeRoles('staff', 'manager', 'admin')
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required before role authorization'
            });
        }

        // Check if user's role is in the list of allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource`
            });
        }

        // Role is permitted, pass to controller
        next();
    };
};

module.exports = { authorizeRoles };
