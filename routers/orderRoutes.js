const express = require("express");
const router = express.Router();

// Controllers
const {
    getCheckoutPage,
    getMyOrdersPage,
    createOrder,
    cancelOrder,
    getAdminDashboard,
    adminUpdateOrderStatus,
    getDeliveryDashboard,
    deliveryUpdateOrderStatus
} = require("../controllers/orderController");

// Middlewares
const { auth, authorizeRoles } = require("../middleware/auth");

// ==========================================
// ORDER, ADMIN & DELIVERY ROUTES
// ==========================================

// Customer Checkout & Orders
router.get("/checkout", auth, getCheckoutPage);
router.get("/orders", auth, getMyOrdersPage);
router.post("/orders", auth, createOrder);
router.put("/orders/:id/cancel", auth, cancelOrder);

// Admin Dashboard & Order Management
router.get("/admin", auth, authorizeRoles("admin"), getAdminDashboard);
router.put("/admin/orders/:id/status", auth, authorizeRoles("admin"), adminUpdateOrderStatus);

// Delivery Dashboard & Status Updates
router.get("/delivery", auth, authorizeRoles("delivery", "admin"), getDeliveryDashboard);
router.put("/delivery/orders/:id/status", auth, authorizeRoles("delivery", "admin"), deliveryUpdateOrderStatus);

module.exports = router;
