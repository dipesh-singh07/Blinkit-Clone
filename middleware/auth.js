const jwt = require("jsonwebtoken");
const authorizeRoles = require("./authorizeRoles");

// =========================================================================
// 1. AUTHENTICATION MIDDLEWARE
// =========================================================================
// This middleware verifies whether the incoming request has a valid JWT token.
// The token can be present in either:
// 1. Authorization header: "Bearer <token>"
// 2. HTTP-only cookie: "token"
const auth = (req, res, next) => {
    try {
        let token = null;

        // Step 1: Check Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }
        // Step 2: If no header, check cookies
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        // Step 3: If no token was found, return 401 Unauthorized
        if (!token) {
            // For browser view requests, redirect to login page
            if (req.accepts("html")) {
                return res.redirect("/login");
            }
            return res.status(401).json({
                success: false,
                message: "Authentication failed. No token provided. Please log in."
            });
        }

        // Step 4: Verify JWT token using the secret key from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Step 5: Attach decoded payload (userId, role, name, email) to the request object
        req.user = decoded;

        // Step 6: Pass control to the next middleware or route handler
        next();
    } catch (error) {
        // If token is invalid or expired
        if (req.accepts("html")) {
            // Clear invalid cookie
            res.clearCookie("token");
            return res.redirect("/login");
        }
        return res.status(401).json({
            success: false,
            message: "Authentication failed. Invalid or expired token."
        });
    }
};

// =========================================================================
// 2. OPTIONAL AUTH MIDDLEWARE (FOR PUBLIC VIEWS)
// =========================================================================
// For pages like the Home or Products page where users can browse without logging in,
// but if they ARE logged in, we want to know who they are to show their name & cart button.
const optionalAuth = (req, res, next) => {
    try {
        let token = null;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            res.locals.user = decoded;
        } else {
            req.user = null;
            res.locals.user = null;
        }
    } catch (err) {
        req.user = null;
        res.locals.user = null;
    }
    next();
};

module.exports = {
    auth,
    authorizeRoles,
    optionalAuth
};
