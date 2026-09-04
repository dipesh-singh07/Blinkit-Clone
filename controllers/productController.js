const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");

// ==========================================
// PRODUCT & CATEGORY CONTROLLER
// ==========================================

// ----------------------------------------------------
// GET / - Home Page (Blinkit Quick Commerce UI)
// ----------------------------------------------------
const getHomePage = async (req, res) => {
    try {
        // Fetch all categories for the category rail
        const categories = await Category.find().sort({ createdAt: 1 });

        // Fetch available products to show on home page
        const products = await Product.find({ isAvailable: true })
            .populate("category")
            .limit(16);

        res.render("home", {
            user: req.user,
            categories,
            products,
            cartCount: 0,
            title: "Blinkit - Groceries in 10 Minutes"
        });
    } catch (error) {
        console.error("Home page error:", error);
        res.status(500).render("home", {
            user: req.user || null,
            categories: [],
            products: [],
            cartCount: 0,
            title: "Blinkit - Groceries in 10 Minutes",
            error: "Failed to load home page."
        });
    }
};

// ----------------------------------------------------
// GET /products - Catalog with Search & Filter
// ----------------------------------------------------
const getAllProducts = async (req, res) => {
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
        res.render("products", {
            user: req.user,
            products,
            categories,
            selectedCategory: category || "",
            searchQuery: search || "",
            cartCount: 0,
            title: "All Products - Blinkit"
        });
    } catch (error) {
        console.error("Get all products error:", error);
        res.status(500).render("products", {
            user: req.user || null,
            products: [],
            categories: [],
            selectedCategory: "",
            searchQuery: "",
            cartCount: 0,
            title: "All Products - Blinkit",
            error: error.message
        });
    }
};

// ----------------------------------------------------
// GET /api/products/search - Search Products API
// ----------------------------------------------------
const searchProductsApi = async (req, res) => {
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
};

// ----------------------------------------------------
// GET /products/category/:categoryId - Filter Products by Category
// ----------------------------------------------------
const getProductsByCategory = async (req, res) => {
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
        res.render("products", {
            user: req.user,
            products,
            categories,
            selectedCategory: categoryId,
            searchQuery: "",
            cartCount: 0,
            title: `${category ? category.name : "Category"} - Blinkit`
        });
    } catch (error) {
        console.error("Products by category error:", error);
        res.redirect("/products");
    }
};

// ----------------------------------------------------
// GET /products/:id - Product Details Page
// ----------------------------------------------------
const getProductById = async (req, res) => {
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

        res.render("product-details", {
            user: req.user,
            product,
            relatedProducts,
            cartCount: 0,
            title: `${product.name} - Blinkit`
        });
    } catch (error) {
        console.error("Product details error:", error);
        res.redirect("/products");
    }
};

// ----------------------------------------------------
// POST /products - Create Product (Admin Only)
// ----------------------------------------------------
const createProduct = async (req, res) => {
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
};

// ----------------------------------------------------
// PUT /products/:id - Update Product (Admin Only)
// ----------------------------------------------------
const updateProduct = async (req, res) => {
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
};

// ----------------------------------------------------
// DELETE /products/:id - Delete Product (Admin Only)
// ----------------------------------------------------
const deleteProduct = async (req, res) => {
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
};

// ----------------------------------------------------
// CATEGORY OPERATIONS
// ----------------------------------------------------

// GET /categories - Public
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        return res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /categories - Admin only
const createCategory = async (req, res) => {
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
};

// PUT /categories/:id - Admin only
const updateCategory = async (req, res) => {
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
};

// DELETE /categories/:id - Admin only
const deleteCategory = async (req, res) => {
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
};

module.exports = {
    getHomePage,
    getAllProducts,
    searchProductsApi,
    getProductsByCategory,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
