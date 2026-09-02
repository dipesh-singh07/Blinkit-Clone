// ==========================================
// 1. IMPORTS & INITIALIZATION
// ==========================================
// Import Express and initialize app
const express = require("express");
const app = express();

// Import Mongoose for MongoDB database interactions
const mongoose = require("mongoose");

// Import bcrypt for password hashing
const bcrypt = require("bcrypt");

// Import jsonwebtoken for creating and verifying JWTs
const jwt = require("jsonwebtoken");

// Import dotenv to load environment variables from .env
const dotenv = require("dotenv");
dotenv.config();

// Import cookie-parser to read JWT tokens stored in HTTP-only cookies
const cookieParser = require("cookie-parser");

// Import our custom authentication and authorization middleware
const { auth, authorizeRoles, optionalAuth } = require("./middleware/auth");

// ==========================================
// 2. VIEW ENGINE & GLOBAL MIDDLEWARE
// ==========================================
// Configure EJS as the templating view engine
app.set("view engine", "ejs");

// Middleware to parse incoming JSON payloads (from fetch API)
app.use(express.json());

// Middleware to parse standard URL-encoded form submissions
app.use(express.urlencoded({ extended: true }));

// Middleware to parse cookies attached to requests
app.use(cookieParser());

// Serve static assets (CSS, client-side JS, images) from the public/ folder
app.use(express.static("public"));

// Global middleware to attach authenticated user info (if any) to all EJS templates
app.use(optionalAuth);

// ==========================================
// 3. DATABASE CONNECTION
// ==========================================
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/blinkit";

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("=========================================");
        console.log(" Connected to MongoDB successfully!");
        console.log(` Database: ${MONGO_URI}`);
        console.log("=========================================");
    })
    .catch((err) => {
        console.error(" MongoDB connection error:", err.message);
    });

// ==========================================
// 4. MONGOOSE SCHEMA & MODEL
// ==========================================
const User = require("./models/User");
const Category = require("./models/Category");
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const Order = require("./models/Order");

// Helper function to get cart item count for the current user
const getCartCount = async (userId) => {
    if (!userId) return 0;
    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    } catch (err) {
        return 0;
    }
};

// ==========================================
// 5. VIEW & AUTHENTICATION ROUTES
// ==========================================

// ----------------------------------------------------
// VIEW ROUTE: Home Page (Blinkit Quick Commerce UI)
// ----------------------------------------------------
app.get("/", async (req, res) => {
    try {
        // Fetch all categories for the category rail
        const categories = await Category.find().sort({ createdAt: 1 });

        // Fetch available products to show on home page
        const products = await Product.find({ isAvailable: true })
            .populate("category")
            .limit(16);

        // Fetch user's cart count if logged in
        const cartCount = req.user ? await getCartCount(req.user.userId) : 0;

        res.render("home", {
            user: req.user,
            categories,
            products,
            cartCount,
            title: "Blinkit - Groceries in 10 Minutes"
        });
    } catch (error) {
        console.error("Home page error:", error);
        res.status(500).render("home", {
            user: req.user || null,
            categories: [],
            products: [],
            cartCount: 0,
            error: "Failed to load home page."
        });
    }
});

// ----------------------------------------------------
// VIEW ROUTE: Register Page
// ----------------------------------------------------
app.get("/register", (req, res) => {
    // If user is already logged in, redirect to home
    if (req.user) return res.redirect("/");
    res.render("register", { user: null, title: "Register - Blinkit" });
});

// ----------------------------------------------------
// VIEW ROUTE: Login Page
// ----------------------------------------------------
app.get("/login", (req, res) => {
    // If user is already logged in, redirect to home
    if (req.user) return res.redirect("/");
    res.render("login", { user: null, title: "Login - Blinkit" });
});

// ----------------------------------------------------
// VIEW ROUTE: Dashboard (Customer Profile & Quick Actions)
// ----------------------------------------------------
app.get("/dashboard", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) return res.redirect("/login");

        const orders = await Order.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(5);
        const cartCount = await getCartCount(req.user.userId);

        res.render("dashboard", {
            user,
            orders,
            cartCount,
            title: "My Account - Blinkit"
        });
    } catch (error) {
        res.status(500).redirect("/");
    }
});

// ----------------------------------------------------
// API ROUTE: Register New User
// ----------------------------------------------------
app.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, address } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide name, email, and password."
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
});

// ----------------------------------------------------
// API ROUTE: Login User
// ----------------------------------------------------
app.post("/login", async (req, res) => {
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
});

// ----------------------------------------------------
// API & VIEW ROUTE: Logout User
// ----------------------------------------------------
app.all("/logout", (req, res) => {
    // Clear the token cookie
    res.clearCookie("token");

    if (req.accepts("html")) {
        return res.redirect("/login");
    }
    return res.status(200).json({
        success: true,
        message: "Logged out successfully."
    });
});

// ==========================================
// 6. PRODUCT & CATEGORY ROUTES
// ==========================================

// ----------------------------------------------------
// CATEGORY CRUD (Admin Only for create/update/delete)
// ----------------------------------------------------

// GET /categories - Public
app.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        return res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// POST /categories - Admin only
app.post("/categories", auth, authorizeRoles("admin"), async (req, res) => {
    try {
        const { name, description, image } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required." });
        }

        const newCategory = new Category({ name: name.trim(), description, image });
        await newCategory.save();

        return res.status(201).json({
            success: true,
            message: "Category created successfully.",
            data: newCategory
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /categories/:id - Admin only
app.put("/categories/:id", auth, authorizeRoles("admin"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid category ID." });
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        return res.status(200).json({
            success: true,
            message: "Category updated successfully.",
            data: updatedCategory
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /categories/:id - Admin only
app.delete("/categories/:id", auth, authorizeRoles("admin"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid category ID." });
        }

        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        return res.status(200).json({
            success: true,
            message: "Category deleted successfully."
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ----------------------------------------------------
// PRODUCT VIEW & SEARCH ROUTES
// ----------------------------------------------------

// VIEW ROUTE: All Products Catalog with Search & Filter
app.get("/products", async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = { isAvailable: true };

        // Search by product name (case-insensitive regex)
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        // Filter by category ID if valid
        if (category && mongoose.Types.ObjectId.isValid(category)) {
            query.category = category;
        }

        const products = await Product.find(query).populate("category");
        const categories = await Category.find().sort({ name: 1 });
        const cartCount = req.user ? await getCartCount(req.user.userId) : 0;

        res.render("products", {
            user: req.user,
            products,
            categories,
            selectedCategory: category || "",
            searchQuery: search || "",
            cartCount,
            title: "All Products - Blinkit"
        });
    } catch (error) {
        res.status(500).render("products", {
            user: req.user || null,
            products: [],
            categories: [],
            selectedCategory: "",
            searchQuery: "",
            cartCount: 0,
            error: error.message
        });
    }
});

// API ROUTE: Search Products (GET /products/search?name=milk)
app.get("/api/products/search", async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ success: false, message: "Search term is required." });
        }
        const products = await Product.find({
            name: { $regex: name, $options: "i" },
            isAvailable: true
        }).populate("category");

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// API & VIEW ROUTE: Category Filter (GET /products/category/:categoryId)
app.get("/products/category/:categoryId", async (req, res) => {
    try {
        const { categoryId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.redirect("/products");
        }

        const products = await Product.find({
            category: categoryId,
            isAvailable: true
        }).populate("category");

        const category = await Category.findById(categoryId);
        const categories = await Category.find().sort({ name: 1 });
        const cartCount = req.user ? await getCartCount(req.user.userId) : 0;

        res.render("products", {
            user: req.user,
            products,
            categories,
            selectedCategory: categoryId,
            searchQuery: "",
            cartCount,
            title: `${category ? category.name : "Category"} - Blinkit`
        });
    } catch (error) {
        res.redirect("/products");
    }
});

// VIEW ROUTE: Product Details Page (GET /products/:id)
app.get("/products/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.redirect("/products");
        }

        const product = await Product.findById(req.params.id).populate("category");
        if (!product) {
            return res.status(404).render("home", {
                user: req.user,
                categories: [],
                products: [],
                cartCount: 0,
                error: "Product not found."
            });
        }

        // Related products in the same category
        const relatedProducts = product.category
            ? await Product.find({
                  category: product.category._id,
                  _id: { $ne: product._id },
                  isAvailable: true
              }).limit(4)
            : [];

        const cartCount = req.user ? await getCartCount(req.user.userId) : 0;

        res.render("product-details", {
            user: req.user,
            product,
            relatedProducts,
            cartCount,
            title: `${product.name} - Blinkit`
        });
    } catch (error) {
        res.redirect("/products");
    }
});

// API ROUTE: Create Product (POST /products - Admin Only)
app.post("/products", auth, authorizeRoles("admin"), async (req, res) => {
    try {
        const { name, description, price, image, category, quantity, unit, brand } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                message: "Name, price, and category are required."
            });
        }

        const newProduct = new Product({
            name: name.trim(),
            description: description || "",
            price: Number(price),
            image: image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
            category,
            quantity: quantity ? Number(quantity) : 100,
            unit: unit || "1 unit",
            brand: brand || "Generic",
            isAvailable: true
        });

        await newProduct.save();

        return res.status(201).json({
            success: true,
            message: "Product created successfully.",
            data: newProduct
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// API ROUTE: Update Product (PUT /products/:id - Admin Only)
app.put("/products/:id", auth, authorizeRoles("admin"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID." });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully.",
            data: updatedProduct
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// API ROUTE: Delete Product (DELETE /products/:id - Admin Only)
app.delete("/products/:id", auth, authorizeRoles("admin"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID." });
        }

        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully."
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// 7. CART ROUTES
// ==========================================

// ----------------------------------------------------
// VIEW ROUTE: Shopping Cart Page
// ----------------------------------------------------
app.get("/cart", auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");

        if (!cart) {
            cart = { items: [], totalPrice: 0 };
        }

        const cartCount = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

        res.render("cart", {
            user: req.user,
            cart,
            cartCount,
            title: "Shopping Cart - Blinkit"
        });
    } catch (error) {
        res.status(500).redirect("/");
    }
});

// ----------------------------------------------------
// API ROUTE: Get Cart Data JSON (GET /api/cart)
// ----------------------------------------------------
app.get("/api/cart", auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");
        return res.status(200).json({
            success: true,
            data: cart || { items: [], totalPrice: 0 }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ----------------------------------------------------
// API ROUTE: Add Product to Cart (POST /cart/add)
// ----------------------------------------------------
app.post("/cart/add", auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const addQty = quantity ? Number(quantity) : 1;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID." });
        }

        // 1. Check product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        // 2. Check if product is available and has stock
        if (!product.isAvailable || product.quantity <= 0) {
            return res.status(400).json({ success: false, message: "Product is currently out of stock." });
        }

        // 3. Find or create user's cart
        let cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            cart = new Cart({ user: req.user.userId, items: [], totalPrice: 0 });
        }

        // 4. Check if item already in cart
        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Increase existing quantity
            cart.items[existingItemIndex].quantity += addQty;
            cart.items[existingItemIndex].price = product.price;
        } else {
            // Add as new item
            cart.items.push({
                product: product._id,
                quantity: addQty,
                price: product.price
            });
        }

        // 5. Recalculate total price
        cart.calculateTotal();
        await cart.save();

        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        return res.status(200).json({
            success: true,
            message: `${product.name} added to cart!`,
            data: {
                cart,
                cartCount: totalItems
            }
        });
    } catch (error) {
        console.error("Cart add error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ----------------------------------------------------
// API ROUTE: Update Cart Item Quantity (PUT /cart/update/:productId)
// ----------------------------------------------------
app.put("/cart/update/:productId", auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const newQty = Number(quantity);

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID." });
        }

        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Item not in cart." });
        }

        if (newQty <= 0) {
            // Remove item if quantity becomes 0
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = newQty;
        }

        cart.calculateTotal();
        await cart.save();

        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully.",
            data: {
                cart,
                cartCount: totalItems
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ----------------------------------------------------
// API ROUTE: Remove Single Product from Cart (DELETE /cart/remove/:productId)
// ----------------------------------------------------
app.delete("/cart/remove/:productId", auth, async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID." });
        }

        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        cart.items = cart.items.filter(
            (item) => item.product.toString() !== productId
        );

        cart.calculateTotal();
        await cart.save();

        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        return res.status(200).json({
            success: true,
            message: "Item removed from cart.",
            data: {
                cart,
                cartCount: totalItems
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ----------------------------------------------------
// API ROUTE: Clear Entire Cart (DELETE /cart/clear)
// ----------------------------------------------------
app.delete("/cart/clear", auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId });
        if (cart) {
            cart.items = [];
            cart.totalPrice = 0;
            await cart.save();
        }

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully."
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// 8. ORDER ROUTES
// ==========================================

// ----------------------------------------------------
// VIEW ROUTE: Checkout Page
// ----------------------------------------------------
app.get("/checkout", auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");
        const user = await User.findById(req.user.userId);

        if (!cart || !cart.items || cart.items.filter((i) => i.product).length === 0) {
            return res.redirect("/cart");
        }

        const validItems = cart.items.filter((i) => i.product);
        const cartCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

        res.render("checkout", {
            user,
            cart: {
                ...cart.toObject(),
                items: validItems
            },
            cartCount,
            title: "Checkout - Blinkit"
        });
    } catch (error) {
        res.status(500).redirect("/cart");
    }
});

// ----------------------------------------------------
// VIEW ROUTE: My Orders Page
// ----------------------------------------------------
app.get("/orders", auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .populate("deliveryUser", "name");

        const cartCount = await getCartCount(req.user.userId);

        res.render("orders", {
            user: req.user,
            orders,
            cartCount,
            title: "My Orders - Blinkit"
        });
    } catch (error) {
        res.status(500).render("orders", {
            user: req.user || null,
            orders: [],
            cartCount: 0,
            error: error.message
        });
    }
});

// ----------------------------------------------------
// API ROUTE: Create / Place Order (POST /orders)
// ----------------------------------------------------
app.post("/orders", auth, async (req, res) => {
    try {
        const { address } = req.body;

        // 1. Get user's cart populated with product details
        const cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");

        // 2. Check that cart is not empty
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty. Add items before placing an order."
            });
        }

        // 3. Prepare order items snapshot filtering valid products
        const orderItems = cart.items
            .filter((item) => item.product)
            .map((item) => {
                return {
                    product: item.product._id,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.product.image || "",
                    unit: item.product.unit || "1 unit"
                };
            });

        if (orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid products in cart to order."
            });
        }

        // 4. Calculate total amount
        const totalAmount = cart.totalPrice;

        // 5. Get delivery address (either submitted or user's default)
        const user = await User.findById(req.user.userId);
        const deliveryAddress = address || (user && user.address) || "101, Main Road, India";

        // 6. Create Order document
        const newOrder = new Order({
            user: req.user.userId,
            items: orderItems,
            totalAmount,
            address: deliveryAddress,
            status: "placed",
            paymentStatus: "pending"
        });

        await newOrder.save();

        // 7. Clear the customer's cart
        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();

        // 8. Return created order
        return res.status(201).json({
            success: true,
            message: "Order placed successfully! Delivery partner will be assigned shortly.",
            data: newOrder
        });
    } catch (error) {
        console.error("Order creation error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ----------------------------------------------------
// API ROUTE: Cancel Order (PUT /orders/:id/cancel)
// ----------------------------------------------------
app.put("/orders/:id/cancel", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID." });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (["delivered", "cancelled"].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled as it is already ${order.status}.`
            });
        }

        order.status = "cancelled";
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully.",
            data: order
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// 9. ADMIN & DELIVERY PROTECTED ROUTES
// ==========================================

// ----------------------------------------------------
// VIEW ROUTE: Admin Dashboard (Admin Only)
// ----------------------------------------------------
app.get("/admin", auth, authorizeRoles("admin"), async (req, res) => {
    try {
        const products = await Product.find().populate("category").sort({ createdAt: -1 });
        const categories = await Category.find().sort({ name: 1 });
        const orders = await Order.find()
            .populate("user", "name email")
            .populate("deliveryUser", "name")
            .sort({ createdAt: -1 });

        const deliveryUsers = await User.find({ role: "delivery" }).select("name email");
        const cartCount = await getCartCount(req.user.userId);

        res.render("admin", {
            user: req.user,
            products,
            categories,
            orders,
            deliveryUsers,
            cartCount,
            title: "Admin Dashboard - Blinkit"
        });
    } catch (error) {
        res.status(500).redirect("/");
    }
});

// ----------------------------------------------------
// API ROUTE: Admin Update Order Status (PUT /admin/orders/:id/status)
// ----------------------------------------------------
app.put("/admin/orders/:id/status", auth, authorizeRoles("admin"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID." });
        }

        const { status, paymentStatus, deliveryUser } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (deliveryUser && mongoose.Types.ObjectId.isValid(deliveryUser)) {
            updateData.deliveryUser = deliveryUser;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Order updated successfully.",
            data: updatedOrder
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ----------------------------------------------------
// VIEW ROUTE: Delivery Partner Dashboard (Delivery Role Only)
// ----------------------------------------------------
app.get("/delivery", auth, authorizeRoles("delivery", "admin"), async (req, res) => {
    try {
        // Show orders assigned to this rider OR all unassigned orders ready for delivery
        const orders = await Order.find({
            $or: [
                { deliveryUser: req.user.userId },
                { deliveryUser: null, status: { $in: ["confirmed", "preparing", "out_for_delivery"] } }
            ]
        })
            .populate("user", "name email address")
            .sort({ createdAt: -1 });

        const cartCount = await getCartCount(req.user.userId);

        res.render("delivery", {
            user: req.user,
            orders,
            cartCount,
            title: "Delivery Partner Dashboard - Blinkit"
        });
    } catch (error) {
        res.status(500).redirect("/");
    }
});

// ----------------------------------------------------
// API ROUTE: Delivery Rider Update Order Status (PUT /delivery/orders/:id/status)
// ----------------------------------------------------
app.put("/delivery/orders/:id/status", auth, authorizeRoles("delivery", "admin"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID." });
        }

        const { status } = req.body;
        const validStatuses = ["out_for_delivery", "delivered"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Delivery partners can only change status to 'out_for_delivery' or 'delivered'."
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Assign to this rider if not already assigned
        if (!order.deliveryUser) {
            order.deliveryUser = req.user.userId;
        }

        order.status = status;
        if (status === "delivered") {
            order.paymentStatus = "paid"; // Cash/Online on delivery marked as paid
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: `Order marked as ${status}!`,
            data: order
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ==========================================
// 10. START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(` Blinkit Server is running on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(`=========================================\n`);
});
