const mongoose = require("mongoose");

// ==========================================
// USER SCHEMA & MODEL
// ==========================================
// Represents all registered users (Customers, Admins, and Delivery Partners)
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters long"]
        },
        role: {
            type: String,
            enum: ["customer", "admin", "delivery"],
            default: "customer"
        },
        address: {
            type: String,
            default: "Flat 101, Sunshine Heights, Mumbai, India"
        }
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
);

// Export User model
module.exports = mongoose.model("User", userSchema);
