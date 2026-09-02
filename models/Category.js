const mongoose = require("mongoose");

// ==========================================
// CATEGORY SCHEMA & MODEL
// ==========================================
// Represents grocery item categories (e.g. Dairy, Fruits, Snacks, Beverages)
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        image: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Export Category model
module.exports = mongoose.model("Category", categorySchema);
