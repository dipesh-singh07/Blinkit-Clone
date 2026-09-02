// =========================================================================
// BLINKIT CLIENT-SIDE JAVASCRIPT
// Handles AJAX API requests using fetch(), DOM updates, and Toast alerts.
// =========================================================================

// --- 1. Toast Notification Utility ---
function showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === "success" ? "✓" : "⚠️"}</span> <span>${message}</span>`;

    container.appendChild(toast);

    // Automatically remove toast after 3.5 seconds
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- 2. Update Cart Count in Navbar ---
function updateNavbarCartCount(count) {
    const badges = document.querySelectorAll(".cart-badge");
    badges.forEach((b) => {
        b.textContent = `${count} items`;
    });
}

// --- 3. Add to Cart Handler ---
async function addToCart(productId, quantity = 1) {
    try {
        const response = await fetch("/cart/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ productId, quantity })
        });

        const data = await response.json();

        if (response.status === 401) {
            showToast("Please log in to add items to your cart.", "error");
            setTimeout(() => {
                window.location.href = "/login";
            }, 1200);
            return;
        }

        if (data.success) {
            showToast(data.message, "success");
            if (data.data && typeof data.data.cartCount !== "undefined") {
                updateNavbarCartCount(data.data.cartCount);
            }
        } else {
            showToast(data.message || "Failed to add to cart.", "error");
        }
    } catch (error) {
        console.error("Add to cart error:", error);
        showToast("Error connecting to server.", "error");
    }
}

// --- 4. Update Cart Item Quantity (Cart Page) ---
async function updateCartQuantity(productId, newQty) {
    try {
        const response = await fetch(`/cart/update/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ quantity: newQty })
        });

        const data = await response.json();
        if (data.success) {
            // Reload cart page to reflect updated prices & item totals
            window.location.reload();
        } else {
            showToast(data.message || "Could not update cart.", "error");
        }
    } catch (error) {
        showToast("Server error.", "error");
    }
}

// --- 5. Remove Item from Cart ---
async function removeCartItem(productId) {
    try {
        const response = await fetch(`/cart/remove/${productId}`, {
            method: "DELETE"
        });

        const data = await response.json();
        if (data.success) {
            showToast(data.message, "success");
            setTimeout(() => window.location.reload(), 500);
        } else {
            showToast(data.message, "error");
        }
    } catch (error) {
        showToast("Server error.", "error");
    }
}

// --- 6. Auth Forms (Register & Login) ---
document.addEventListener("DOMContentLoaded", () => {
    // A. Handle Registration Form Submit
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = registerForm.querySelector("button[type='submit']");
            submitBtn.disabled = true;
            submitBtn.textContent = "Creating Account...";

            const payload = {
                name: registerForm.name.value,
                email: registerForm.email.value,
                password: registerForm.password.value,
                role: registerForm.role ? registerForm.role.value : "customer",
                address: registerForm.address ? registerForm.address.value : ""
            };

            try {
                const res = await fetch("/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (data.success) {
                    showToast(data.message, "success");
                    setTimeout(() => {
                        window.location.href = "/login";
                    }, 1200);
                } else {
                    showToast(data.message || "Registration failed.", "error");
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Register";
                }
            } catch (err) {
                showToast("Network error. Please try again.", "error");
                submitBtn.disabled = false;
                submitBtn.textContent = "Register";
            }
        });
    }

    // B. Handle Login Form Submit
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector("button[type='submit']");
            submitBtn.disabled = true;
            submitBtn.textContent = "Logging in...";

            const payload = {
                email: loginForm.email.value,
                password: loginForm.password.value
            };

            try {
                const res = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (data.success) {
                    showToast(data.message, "success");
                    setTimeout(() => {
                        window.location.href = data.data.redirectUrl || "/";
                    }, 1000);
                } else {
                    showToast(data.message || "Login failed.", "error");
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Log In";
                }
            } catch (err) {
                showToast("Network error. Please try again.", "error");
                submitBtn.disabled = false;
                submitBtn.textContent = "Log In";
            }
        });
    }

    // C. Handle Place Order (Checkout Page)
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const placeBtn = document.getElementById("place-order-btn");
            if (placeBtn) {
                placeBtn.disabled = true;
                placeBtn.textContent = "Placing Order in 10 mins...";
            }

            const address = checkoutForm.deliveryAddress.value;

            try {
                const res = await fetch("/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address })
                });

                const data = await res.json();
                if (data.success) {
                    showToast("Order placed successfully! 🚀", "success");
                    setTimeout(() => {
                        window.location.href = "/orders";
                    }, 1200);
                } else {
                    showToast(data.message || "Failed to place order.", "error");
                    if (placeBtn) {
                        placeBtn.disabled = false;
                        placeBtn.textContent = "Place Order";
                    }
                }
            } catch (err) {
                showToast("Server error.", "error");
                if (placeBtn) {
                    placeBtn.disabled = false;
                    placeBtn.textContent = "Place Order";
                }
            }
        });
    }
});

// --- 7. Cancel Order Handler ---
async function cancelOrder(orderId) {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
        const response = await fetch(`/orders/${orderId}/cancel`, {
            method: "PUT"
        });
        const data = await response.json();

        if (data.success) {
            showToast(data.message, "success");
            setTimeout(() => window.location.reload(), 600);
        } else {
            showToast(data.message, "error");
        }
    } catch (err) {
        showToast("Error cancelling order.", "error");
    }
}

// --- 8. Admin Status Update Handler ---
async function updateOrderStatus(orderId, statusSelectElem) {
    const newStatus = statusSelectElem.value;
    try {
        const response = await fetch(`/admin/orders/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if (data.success) {
            showToast(`Order status updated to ${newStatus}`, "success");
        } else {
            showToast(data.message, "error");
        }
    } catch (err) {
        showToast("Server error.", "error");
    }
}

// --- 9. Delivery Partner Status Update Handler ---
async function updateDeliveryStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/delivery/orders/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if (data.success) {
            showToast(data.message, "success");
            setTimeout(() => window.location.reload(), 600);
        } else {
            showToast(data.message, "error");
        }
    } catch (err) {
        showToast("Server error.", "error");
    }
}
