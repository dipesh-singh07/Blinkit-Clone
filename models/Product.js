const mongoose = require("mongoose");

// ==========================================
// PRODUCT SCHEMA & MODEL
// ==========================================
// Represents individual items for sale (e.g. Amul Milk, Britannia Bread, Maggi)
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"]
        },
        image: {
            type: String,
            default: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60"
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Product category is required"]
        },
        quantity: {
            type: Number,
            default: 100, // Stock available in store
            min: [0, "Quantity cannot be negative"]
        },
        unit: {
            type: String,
            default: "1 unit" // e.g. "500 ml", "1 kg", "Pack of 4", "100 g"
        },
        brand: {
            type: String,
            default: "Generic"
        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Export Product model
module.exports = mongoose.model("Product", productSchema);
