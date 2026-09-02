const mongoose = require("mongoose");

// ==========================================
// CART SCHEMA & MODEL
// ==========================================
// Represents a customer's shopping cart before checkout
const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: [1, "Quantity cannot be less than 1"]
    },
    price: {
        type: Number,
        required: true
    }
});

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true // Each user has one cart
        },
        items: [cartItemSchema],
        totalPrice: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Helper method to recalculate total cart price
cartSchema.methods.calculateTotal = function () {
    this.totalPrice = this.items.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
    return this.totalPrice;
};

// Export Cart model
module.exports = mongoose.model("Cart", cartSchema);
