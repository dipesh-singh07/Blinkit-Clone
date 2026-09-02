const mongoose = require("mongoose");

// ==========================================
// ORDER SCHEMA & MODEL
// ==========================================
// Represents confirmed customer orders with lifecycle status
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    unit: {
        type: String,
        default: "1 unit"
    }
});

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        items: [orderItemSchema],
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        address: {
            type: String,
            required: [true, "Delivery address is required"]
        },
        status: {
            type: String,
            enum: [
                "placed",
                "confirmed",
                "preparing",
                "out_for_delivery",
                "delivered",
                "cancelled"
            ],
            default: "placed"
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending"
        },
        deliveryUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null // Can be assigned to a delivery partner
        }
    },
    {
        timestamps: true
    }
);

// Export Order model
module.exports = mongoose.model("Order", orderSchema);
