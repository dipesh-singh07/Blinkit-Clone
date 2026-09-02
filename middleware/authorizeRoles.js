// =========================================================================
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// =========================================================================
// This function takes allowed roles (e.g. "admin", "delivery") and returns a middleware
// that checks if the logged-in user's role matches any of the allowed roles.
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user must already exist from the auth middleware
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            if (req.accepts("html")) {
                return res.status(403).render("home", {
                    user: req.user || null,
                    categories: [],
                    products: [],
                    cartCount: 0,
                    title: "Access Forbidden - Blinkit",
                    error: "Access Forbidden: You do not have permission to access this page."
                });
            }
            return res.status(403).json({
                success: false,
                message: `Access forbidden: Role '${req.user ? req.user.role : "unknown"}' is not authorized to access this resource.`
            });
        }
        next();
    };
};

module.exports = authorizeRoles;
