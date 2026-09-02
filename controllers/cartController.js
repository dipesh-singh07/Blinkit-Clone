const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ==========================================
// CART CONTROLLER
// ==========================================

// ----------------------------------------------------
// GET /cart - Shopping Cart Page View
// ----------------------------------------------------
const getCartPage = async (req, res) => {
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
        console.error("Get cart page error:", error);
        res.status(500).redirect("/");
    }
};

// ----------------------------------------------------
// GET /api/cart - Get Cart JSON
// ----------------------------------------------------
const getCartApi = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");
        return res.status(200).json({
            success: true,
            data: cart || { items: [], totalPrice: 0 }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ----------------------------------------------------
// POST /cart/add - Add Product to Cart
// ----------------------------------------------------
const addToCart = async (req, res) => {
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
};

// ----------------------------------------------------
// PUT /cart/update/:productId - Update Item Quantity
// ----------------------------------------------------
const updateCartItem = async (req, res) => {
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
};

// ----------------------------------------------------
// DELETE /cart/remove/:productId - Remove Item from Cart
// ----------------------------------------------------
const removeFromCart = async (req, res) => {
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
};

// ----------------------------------------------------
// DELETE /cart/clear - Clear Entire Cart
// ----------------------------------------------------
const clearCart = async (req, res) => {
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
};

module.exports = {
    getCartPage,
    getCartApi,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
