// =========================================================================
// 1. IMPORT PACKAGES & ENVIRONMENT CONFIGURATION
// =========================================================================
const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// Load environment variables from .env
dotenv.config();

// Database Connection
const connectDB = require("./config/db");

// Middlewares
const { optionalAuth } = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");

// Routers
const authRoutes = require("./routers/authRoutes");
const productRoutes = require("./routers/productRoutes");
const cartRoutes = require("./routers/cartRoutes");
const orderRoutes = require("./routers/orderRoutes");

// =========================================================================
// 2. CREATE EXPRESS APP & CONFIGURE MIDDLEWARE
// =========================================================================
const app = express();

// Configure EJS view engine
app.set("view engine", "ejs");

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Serve static assets from the public folder
app.use(express.static("public"));

// Global user session middleware for views
app.use(optionalAuth);

// =========================================================================
// 3. DATABASE CONNECTION
// =========================================================================
connectDB();

// =========================================================================
// 4. MOUNT ROUTERS
// =========================================================================
app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/", cartRoutes);
app.use("/", orderRoutes);

// =========================================================================
// 5. ERROR HANDLING MIDDLEWARE
// =========================================================================
app.use(errorHandler);

// =========================================================================
// 6. START SERVER
// =========================================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(` Blinkit Server is running on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(`=========================================\n`);
});

module.exports = app;
