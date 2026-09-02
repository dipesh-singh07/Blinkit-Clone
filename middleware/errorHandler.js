// =========================================================================
// CENTRALIZED ERROR HANDLING MIDDLEWARE
// =========================================================================
// Captures any unhandled error thrown across the Express application
const errorHandler = (err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err.message);

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Check if client expects HTML view or JSON response
    if (req.accepts("html")) {
        return res.status(statusCode).render("home", {
            user: req.user || null,
            categories: [],
            products: [],
            cartCount: 0,
            title: "Error - Blinkit",
            error: err.message || "An unexpected error occurred."
        });
    }

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
};

module.exports = errorHandler;
