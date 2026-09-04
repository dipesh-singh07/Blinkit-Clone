const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");

// ==========================================
// ORDER & DASHBOARD CONTROLLER
// ==========================================

// ----------------------------------------------------
// GET /checkout - Render Checkout Page
// ----------------------------------------------------
const getCheckoutPage = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        res.render("checkout", {
            user,
            cartCount: 0,
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

        res.render("orders", {
            user: req.user,
            orders,
            cartCount: 0,
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
// POST /orders - Create / Place Order from LocalStorage Cart
// ----------------------------------------------------
const createOrder = async (req, res) => {
    try {
        const { items, address } = req.body;

        // 1. Fetch user's cart from DB if body items not provided
        let targetItems = items;
        let cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");

        if (!targetItems || !Array.isArray(targetItems) || targetItems.length === 0) {
            if (cart && cart.items && cart.items.length > 0) {
                targetItems = cart.items.map((i) => ({
                    productId: i.product._id || i.product,
                    quantity: i.quantity
                }));
            }
        }

        if (!targetItems || !Array.isArray(targetItems) || targetItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty. Add items before placing an order."
            });
        }

        // 2. Validate delivery address
        const user = await User.findById(req.user.userId);
        const deliveryAddress = (address && address.trim()) || (user && user.address);

        if (!deliveryAddress) {
            return res.status(400).json({
                success: false,
                message: "Delivery address is required."
            });
        }

        // 3. Process and validate products against MongoDB (prices, availability)
        const orderItems = [];
        let itemsTotal = 0;

        for (const item of targetItems) {
            const productId = item.productId || item.product;
            if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
                continue;
            }

            // Fetch authoritative product from MongoDB
            const product = await Product.findById(productId);
            if (!product || !product.isAvailable) {
                continue;
            }

            const qty = Math.max(1, Number(item.quantity) || 1);
            const price = product.price; // Use MongoDB price, do not trust client price

            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: qty,
                price: price,
                image: product.image || "",
                unit: product.unit || "1 unit"
            });

            itemsTotal += price * qty;
        }

        if (orderItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid products in cart available for order."
            });
        }

        // 4. Calculate total amount (Items Total + ₹2 handling fee)
        const totalAmount = itemsTotal + 2;

        // 5. Create Order document in MongoDB
        const newOrder = new Order({
            user: req.user.userId,
            items: orderItems,
            totalAmount,
            address: deliveryAddress,
            status: "placed",
            paymentStatus: "pending"
        });

        await newOrder.save();

        // 6. Clear user cart in MongoDB
        if (cart) {
            cart.items = [];
            cart.totalPrice = 0;
            await cart.save();
        }

        // 7. Return successful response
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

        res.render("admin", {
            user: req.user,
            products,
            categories,
            orders,
            deliveryUsers,
            cartCount: 0,
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

        res.render("delivery", {
            user: req.user,
            orders,
            cartCount: 0,
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
