const express = require("express");
const router = express.Router();

// Controllers
const {
    getRegisterPage,
    getLoginPage,
    getDashboardPage,
    register,
    login,
    logout
} = require("../controllers/authController");

// Middlewares
const { auth } = require("../middleware/auth");

// ==========================================
// AUTHENTICATION & USER ROUTES
// ==========================================

// Views
router.get("/register", getRegisterPage);
router.get("/login", getLoginPage);
router.get("/dashboard", auth, getDashboardPage);

// Auth Actions (APIs)
router.post("/register", register);
router.post("/login", login);
router.all("/logout", logout);

module.exports = router;
