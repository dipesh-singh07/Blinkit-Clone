const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ==========================================
// CART CONTROLLER (MONGODB BACKEND SYNC)
// ==========================================

// Helper to compute total items count in cart
const calculateCartCount = (cart) => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
};

// ----------------------------------------------------
// GET /cart - Render Cart Page View
// ----------------------------------------------------
const getCartPage = async (req, res) => {
    try {
        res.render("cart", {
            user: req.user || null,
            cart: { items: [], totalPrice: 0 },
            cartCount: 0,
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
        if (!req.user) {
            return res.status(200).json({
                success: true,
                data: { items: [], totalPrice: 0, cartCount: 0 }
            });
        }

        let cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");
        if (!cart) {
            cart = { items: [], totalPrice: 0 };
        }

        const cartCount = calculateCartCount(cart);
        return res.status(200).json({
            success: true,
            data: {
                ...cart.toObject ? cart.toObject() : cart,
                cartCount
            }
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

        // 1. Fetch product from MongoDB
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        if (!product.isAvailable || product.quantity <= 0) {
            return res.status(400).json({ success: false, message: "Product is currently out of stock." });
        }

        // 2. Find or create user cart
        let cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            cart = new Cart({ user: req.user.userId, items: [], totalPrice: 0 });
        }

        // 3. Check existing item
        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        let currentCartQty = 0;
        if (existingItemIndex > -1) {
            currentCartQty = cart.items[existingItemIndex].quantity;
        }

        const targetQty = currentCartQty + addQty;

        // Stock check limit
        if (targetQty > product.quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.quantity} units available in stock.`
            });
        }

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity = targetQty;
            cart.items[existingItemIndex].price = product.price;
        } else {
            cart.items.push({
                product: product._id,
                quantity: targetQty,
                price: product.price
            });
        }

        cart.calculateTotal();
        await cart.save();

        await cart.populate("items.product");
        const cartCount = calculateCartCount(cart);

        return res.status(200).json({
            success: true,
            message: `${product.name} added to cart!`,
            data: {
                cart,
                cartCount
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
        const targetQty = Number(quantity);

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

        if (itemIndex === -1 && targetQty > 0) {
            // If item not yet in cart, fetch product to add it
            const product = await Product.findById(productId);
            if (!product || !product.isAvailable) {
                return res.status(404).json({ success: false, message: "Product unavailable." });
            }
            if (targetQty > product.quantity) {
                return res.status(400).json({ success: false, message: `Only ${product.quantity} units in stock.` });
            }
            cart.items.push({
                product: product._id,
                quantity: targetQty,
                price: product.price
            });
        } else if (itemIndex > -1) {
            if (targetQty <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                const product = await Product.findById(productId);
                if (product && targetQty > product.quantity) {
                    return res.status(400).json({ success: false, message: `Only ${product.quantity} units available in stock.` });
                }
                cart.items[itemIndex].quantity = targetQty;
            }
        }

        cart.calculateTotal();
        await cart.save();

        await cart.populate("items.product");
        const cartCount = calculateCartCount(cart);

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully.",
            data: {
                cart,
                cartCount
            }
        });
    } catch (error) {
        console.error("Update cart error:", error);
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

        await cart.populate("items.product");
        const cartCount = calculateCartCount(cart);

        return res.status(200).json({
            success: true,
            message: "Item removed from cart.",
            data: {
                cart,
                cartCount
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
            message: "Cart cleared successfully.",
            data: {
                cart: { items: [], totalPrice: 0 },
                cartCount: 0
            }
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
