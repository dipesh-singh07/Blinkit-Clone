const Cart = require("../models/Cart");

// ==========================================
// CART HELPER UTILITY
// ==========================================
// Helper function to get total item count in cart for a given user
const getCartCount = async (userId) => {
    if (!userId) return 0;
    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    } catch (err) {
        console.error("Error in getCartCount helper:", err.message);
        return 0;
    }
};

module.exports = {
    getCartCount
};
