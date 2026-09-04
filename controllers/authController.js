const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Order = require("../models/Order");

// ==========================================
// AUTH CONTROLLER
// ==========================================

// ----------------------------------------------------
// GET /register - Render Register Page
// ----------------------------------------------------
const getRegisterPage = (req, res) => {
    // If user is already logged in, redirect to home
    if (req.user) return res.redirect("/");
    res.render("register", { user: null, title: "Register - Blinkit" });
};

// ----------------------------------------------------
// GET /login - Render Login Page
// ----------------------------------------------------
const getLoginPage = (req, res) => {
    // If user is already logged in, redirect to home
    if (req.user) return res.redirect("/");
    res.render("login", { user: null, title: "Login - Blinkit" });
};

// ----------------------------------------------------
// GET /dashboard - Render Customer Dashboard
// ----------------------------------------------------
const getDashboardPage = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) return res.redirect("/login");

        const orders = await Order.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(5);

        res.render("dashboard", {
            user,
            orders,
            cartCount: 0,
            title: "My Account - Blinkit"
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).redirect("/");
    }
};

// ----------------------------------------------------
// POST /register - Register New User
// ----------------------------------------------------
const register = async (req, res) => {
    try {
        const { name, email, password, role, address } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password || !address || !name.trim() || !email.trim() || !password.trim() || !address.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields: Full Name, Email Address, Password, and Delivery Address."
            });
        }

        // 2. Check whether user with this email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists. Please log in."
            });
        }

        // 3. Hash the plain password with bcrypt (salt rounds = 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create new user document
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role || "customer",
            address: address || "Flat 101, Sunshine Heights, Mumbai"
        });

        // 5. Save user in MongoDB
        await newUser.save();

        // 6. Return success response (never return password)
        return res.status(201).json({
            success: true,
            message: "User registered successfully! You can now log in.",
            data: {
                userId: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during registration. " + error.message
        });
    }
};

// ----------------------------------------------------
// POST /login - Login User & Set JWT Cookie
// ----------------------------------------------------
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate inputs
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password."
            });
        }

        // 2. Find user in MongoDB by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // 3. Compare entered password with hashed password stored in DB
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // 4. Generate JWT with payload (userId and role)
        const payload = {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "7d" // Token valid for 7 days
        });

        // 5. Store JWT inside HTTP-Only cookie for secure browser access
        res.cookie("token", token, {
            httpOnly: true, // Prevents client-side JS XSS access
            secure: process.env.NODE_ENV === "production", // HTTPS in production
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        // 6. Return successful response with redirect URL based on role
        let redirectUrl = "/";
        if (user.role === "admin") redirectUrl = "/admin";
        else if (user.role === "delivery") redirectUrl = "/delivery";

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}!`,
            data: {
                token,
                role: user.role,
                redirectUrl
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during login. " + error.message
        });
    }
};

// ----------------------------------------------------
// ALL /logout - Logout User
// ----------------------------------------------------
const logout = (req, res) => {
    // Clear the token cookie
    res.clearCookie("token");

    if (req.accepts("html")) {
        return res.redirect("/login");
    }
    return res.status(200).json({
        success: true,
        message: "Logged out successfully."
    });
};

module.exports = {
    getRegisterPage,
    getLoginPage,
    getDashboardPage,
    register,
    login,
    logout
};
