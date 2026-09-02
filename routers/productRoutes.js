const express = require("express");
const router = express.Router();

// Controllers
const {
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
} = require("../controllers/productController");

// Middlewares
const { auth, authorizeRoles } = require("../middleware/auth");

// ==========================================
// PRODUCT & CATEGORY ROUTES
// ==========================================

// Home Page
router.get("/", getHomePage);

// Category Endpoints
router.get("/categories", getCategories);
router.post("/categories", auth, authorizeRoles("admin"), createCategory);
router.put("/categories/:id", auth, authorizeRoles("admin"), updateCategory);
router.delete("/categories/:id", auth, authorizeRoles("admin"), deleteCategory);

// Product Catalog & Search
router.get("/products", getAllProducts);
router.get("/api/products/search", searchProductsApi);
router.get("/products/category/:categoryId", getProductsByCategory);
router.get("/products/:id", getProductById);

// Product Admin CRUD Endpoints
router.post("/products", auth, authorizeRoles("admin"), createProduct);
router.put("/products/:id", auth, authorizeRoles("admin"), updateProduct);
router.delete("/products/:id", auth, authorizeRoles("admin"), deleteProduct);

module.exports = router;
