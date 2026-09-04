const express = require("express");
const router = express.Router();

// Controllers
const {
    getCartPage,
    getCartApi,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require("../controllers/cartController");

// Middlewares
const { auth, optionalAuth } = require("../middleware/auth");

// ==========================================
// CART ROUTES
// ==========================================

// Cart View & JSON API
router.get("/cart", optionalAuth, getCartPage);
router.get("/api/cart", optionalAuth, getCartApi);

// Cart Mutations (Requires Authentication)
router.post("/cart/add", auth, addToCart);
router.put("/cart/update/:productId", auth, updateCartItem);
router.delete("/cart/remove/:productId", auth, removeFromCart);
router.delete("/cart/clear", auth, clearCart);

module.exports = router;
