const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { getCartCount } = require("../utils/cartHelper");

// ==========================================
// ORDER & DASHBOARD CONTROLLER
// ==========================================

// ----------------------------------------------------
// GET /checkout - Render Checkout Page
// ----------------------------------------------------
const getCheckoutPage = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");
        const user = await User.findById(req.user.userId);

        if (!cart || !cart.items || cart.items.filter((i) => i.product).length === 0) {
            return res.redirect("/cart");
        }

        const validItems = cart.items.filter((i) => i.product);
        const cartCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

        res.render("checkout", {
            user,
            cart: {
                ...cart.toObject(),
                items: validItems
            },
            cartCount,
            title: "Checkout - Blinkit"
        });
    } catch (error) {
        console.error("Checkout page error:", error);
        res.status(500).redirect("/cart");
    }
};

// ----------------------------------------------------
// GET /orders - Render Customer Orders Page
// ----------------------------------------------------
const getMyOrdersPage = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .populate("deliveryUser", "name");

        const cartCount = await getCartCount(req.user.userId);

        res.render("orders", {
            user: req.user,
            orders,
            cartCount,
            title: "My Orders - Blinkit"
        });
    } catch (error) {
        console.error("Orders page error:", error);
        res.status(500).render("orders", {
            user: req.user || null,
            orders: [],
            cartCount: 0,
            title: "My Orders - Blinkit",
            error: error.message
        });
    }
};

// ----------------------------------------------------
// POST /orders - Create / Place Order
// ----------------------------------------------------
const createOrder = async (req, res) => {
    try {
        const { address } = req.body;

        // 1. Get user's cart populated with product details
        const cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");

        // 2. Check that cart is not empty
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty. Add items before placing an order."
            });
        }

        // 3. Prepare order items snapshot filtering valid products
        const orderItems = cart.items
            .filter((item) => item.product)
            .map((item) => {
                return {
                    product: item.product._id,
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.product.image || "",
                    unit: item.product.unit || "1 unit"
                };
            });

        if (orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid products in cart to order."
            });
        }

        // 4. Calculate total amount
        const totalAmount = cart.totalPrice;

        // 5. Get delivery address (either submitted or user's default)
        const user = await User.findById(req.user.userId);
        const deliveryAddress = address || (user && user.address) || "101, Main Road, India";

        // 6. Create Order document
        const newOrder = new Order({
            user: req.user.userId,
            items: orderItems,
            totalAmount,
            address: deliveryAddress,
            status: "placed",
            paymentStatus: "pending"
        });

        await newOrder.save();

        // 7. Clear the customer's cart
        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();

        // 8. Return created order
        return res.status(201).json({
            success: true,
            message: "Order placed successfully! Delivery partner will be assigned shortly.",
            data: newOrder
        });
    } catch (error) {
        console.error("Order creation error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ----------------------------------------------------
// PUT /orders/:id/cancel - Cancel Customer Order
// ----------------------------------------------------
const cancelOrder = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID." });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (["delivered", "cancelled"].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled as it is already ${order.status}.`
            });
        }

        order.status = "cancelled";
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully.",
            data: order
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ----------------------------------------------------
// GET /admin - Admin Dashboard View (Admin Only)
// ----------------------------------------------------
const getAdminDashboard = async (req, res) => {
    try {
        const products = await Product.find().populate("category").sort({ createdAt: -1 });
        const categories = await Category.find().sort({ name: 1 });
        const orders = await Order.find()
            .populate("user", "name email")
            .populate("deliveryUser", "name")
            .sort({ createdAt: -1 });

        const deliveryUsers = await User.find({ role: "delivery" }).select("name email");
        const cartCount = await getCartCount(req.user.userId);

        res.render("admin", {
            user: req.user,
            products,
            categories,
            orders,
            deliveryUsers,
            cartCount,
            title: "Admin Dashboard - Blinkit"
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);
        res.status(500).redirect("/");
    }
};

// ----------------------------------------------------
// PUT /admin/orders/:id/status - Admin Update Order Status
// ----------------------------------------------------
const adminUpdateOrderStatus = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID." });
        }

        const { status, paymentStatus, deliveryUser } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (deliveryUser && mongoose.Types.ObjectId.isValid(deliveryUser)) {
            updateData.deliveryUser = deliveryUser;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Order updated successfully.",
            data: updatedOrder
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ----------------------------------------------------
// GET /delivery - Delivery Partner Dashboard View
// ----------------------------------------------------
const getDeliveryDashboard = async (req, res) => {
    try {
        // Show orders assigned to this rider OR all unassigned orders ready for delivery
        const orders = await Order.find({
            $or: [
                { deliveryUser: req.user.userId },
                { deliveryUser: null, status: { $in: ["confirmed", "preparing", "out_for_delivery"] } }
            ]
        })
            .populate("user", "name email address")
            .sort({ createdAt: -1 });

        const cartCount = await getCartCount(req.user.userId);

        res.render("delivery", {
            user: req.user,
            orders,
            cartCount,
            title: "Delivery Partner Dashboard - Blinkit"
        });
    } catch (error) {
        console.error("Delivery dashboard error:", error);
        res.status(500).redirect("/");
    }
};

// ----------------------------------------------------
// PUT /delivery/orders/:id/status - Delivery Partner Update Status
// ----------------------------------------------------
const deliveryUpdateOrderStatus = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID." });
        }

        const { status } = req.body;
        const validStatuses = ["out_for_delivery", "delivered"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Delivery partners can only change status to 'out_for_delivery' or 'delivered'."
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Assign to this rider if not already assigned
        if (!order.deliveryUser) {
            order.deliveryUser = req.user.userId;
        }

        order.status = status;
        if (status === "delivered") {
            order.paymentStatus = "paid"; // Cash/Online on delivery marked as paid
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: `Order marked as ${status}!`,
            data: order
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getCheckoutPage,
    getMyOrdersPage,
    createOrder,
    cancelOrder,
    getAdminDashboard,
    adminUpdateOrderStatus,
    getDeliveryDashboard,
    deliveryUpdateOrderStatus
};
