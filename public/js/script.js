// =========================================================================
// BLINKIT CLIENT-SIDE JAVASCRIPT
// Product Card Quantity Stepper Controls & Browser LocalStorage Cart
// =========================================================================

// LocalStorage Cart Key
const CART_STORAGE_KEY = "blinkit_cart";

// --- LocalStorage Cart Helpers ---
function loadCartFromStorage() {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Failed to load cart from localStorage:", e);
    }
    return [];
}

function saveCartToStorage(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error("Failed to save cart to localStorage:", e);
    }
}

function clearCartStorage() {
    try {
        localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
        console.error("Failed to remove cart from localStorage:", e);
    }
}

// Global In-Memory Cart State (Loaded from browser localStorage)
window.userCart = loadCartFromStorage();

// Check if user is currently logged in via navbar session link
function isUserLoggedIn() {
    return document.querySelector('a[href="/logout"]') !== null;
}

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

// --- 2. Calculate Total Number of Items in Cart ---
function getCartTotalItemCount() {
    if (!Array.isArray(window.userCart)) return 0;
    return window.userCart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

// --- 3. Update Navbar Cart Badge ---
function updateNavbarCartCount() {
    const totalCount = getCartTotalItemCount();
    const badges = document.querySelectorAll(".cart-badge");
    badges.forEach((b) => {
        b.textContent = `${totalCount} items`;
    });
}

// --- 4. Synchronize Product Cards UI Steppers ---
function syncProductCardsUI() {
    const actionContainers = document.querySelectorAll(".product-cart-action");

    actionContainers.forEach((container) => {
        const productId = container.dataset.productId;
        const stock = Number(container.dataset.stock) || 100;

        if (!productId) return;

        // Find item in window.userCart
        const cartItem = window.userCart.find((item) => {
            if (!item) return false;
            const pId = item.productId || (item.product ? (item.product._id || item.product) : null);
            return pId === productId;
        });

        const currentQty = cartItem ? Number(cartItem.quantity) : 0;

        if (currentQty > 0) {
            // Render [ − qty + ] stepper control
            const isStockExhausted = currentQty >= stock;
            container.innerHTML = `
                <div class="qty-control card-qty-control">
                    <button class="qty-btn" onclick="handleDecreaseQty('${productId}')" title="Decrease quantity">-</button>
                    <span class="qty-number">${currentQty}</span>
                    <button class="qty-btn" onclick="handleIncreaseQty('${productId}', ${stock})" ${isStockExhausted ? "disabled" : ""} title="${isStockExhausted ? 'Max stock reached' : 'Increase quantity'}">+</button>
                </div>
            `;
        } else {
            // Render [ ADD ] button
            container.innerHTML = `
                <button class="btn-add" onclick="handleAddToCart('${productId}')">ADD</button>
            `;
        }
    });
}

// --- 5. Load Cart from Browser LocalStorage ---
function fetchUserCart() {
    window.userCart = loadCartFromStorage();
    updateNavbarCartCount();
    syncProductCardsUI();

    if (document.getElementById("cart-page-container")) {
        renderCartPage();
    }
    if (document.getElementById("checkout-page-container")) {
        renderCheckoutPage();
    }
}

// --- 6. Handle ADD Click ---
function handleAddToCart(productId) {
    if (!productId) return;

    // Cart operations are for logged-in users
    if (!isUserLoggedIn()) {
        showToast("Please log in to add items to your cart.", "error");
        setTimeout(() => {
            window.location.href = "/login";
        }, 1200);
        return;
    }

    const container = document.querySelector(`.product-cart-action[data-product-id="${productId}"]`);
    const stock = Number(container ? container.dataset.stock : 100) || 100;

    // Check if product already exists in localStorage cart
    const existingItem = window.userCart.find((item) => {
        if (!item) return false;
        const pId = item.productId || (item.product ? (item.product._id || item.product) : null);
        return pId === productId;
    });

    if (existingItem) {
        const currentQty = Number(existingItem.quantity) || 0;
        if (currentQty >= stock) {
            showToast(`Only ${stock} units available in stock.`, "error");
            return;
        }
        existingItem.quantity = currentQty + 1;
    } else {
        // Extract product details from DOM dataset or fallback card elements
        let name = "Grocery Item";
        let price = 0;
        let image = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";
        let unit = "1 unit";

        if (container) {
            if (container.dataset.productName) name = container.dataset.productName;
            if (container.dataset.productPrice) price = Number(container.dataset.productPrice) || 0;
            if (container.dataset.productImage) image = container.dataset.productImage;
            if (container.dataset.productUnit) unit = container.dataset.productUnit;
        }

        if (!container || !container.dataset.productName) {
            const card = container ? container.closest(".product-card") : null;
            if (card) {
                const nameEl = card.querySelector(".product-name");
                if (nameEl) name = nameEl.textContent.trim();
                const priceEl = card.querySelector(".product-price");
                if (priceEl) {
                    const parsedPrice = Number(priceEl.textContent.replace(/[^0-9.]/g, ""));
                    if (!isNaN(parsedPrice)) price = parsedPrice;
                }
                const imgEl = card.querySelector("img");
                if (imgEl && imgEl.src) image = imgEl.src;
                const unitEl = card.querySelector(".product-unit");
                if (unitEl) unit = unitEl.textContent.trim();
            }
        }

        window.userCart.push({
            productId,
            name,
            price,
            image,
            unit,
            stock,
            quantity: 1,
            product: {
                _id: productId,
                name,
                price,
                image,
                unit,
                quantity: stock
            }
        });
    }

    saveCartToStorage(window.userCart);
    updateNavbarCartCount();
    syncProductCardsUI();
    showToast("Added to cart! 🛒", "success");

    if (document.getElementById("cart-page-container")) {
        renderCartPage();
    }
    if (document.getElementById("checkout-page-container")) {
        renderCheckoutPage();
    }
}

// Backward compatibility alias
function addToCart(productId) {
    handleAddToCart(productId);
}

// --- 7. Handle (+) Click ---
function handleIncreaseQty(productId, stock) {
    if (!productId) return;

    const cartItem = window.userCart.find((item) => {
        if (!item) return false;
        const pId = item.productId || (item.product ? (item.product._id || item.product) : null);
        return pId === productId;
    });

    if (!cartItem) return;

    const currentQty = Number(cartItem.quantity) || 0;
    const maxStock = Number(stock) || Number(cartItem.stock) || 100;
    const targetQty = currentQty + 1;

    if (targetQty > maxStock) {
        showToast(`Only ${maxStock} units available in stock.`, "error");
        return;
    }

    cartItem.quantity = targetQty;
    saveCartToStorage(window.userCart);
    updateNavbarCartCount();
    syncProductCardsUI();

    if (document.getElementById("cart-page-container")) {
        renderCartPage();
    }
    if (document.getElementById("checkout-page-container")) {
        renderCheckoutPage();
    }
}

// --- 8. Handle (−) Click ---
function handleDecreaseQty(productId) {
    if (!productId) return;

    const itemIndex = window.userCart.findIndex((item) => {
        if (!item) return false;
        const pId = item.productId || (item.product ? (item.product._id || item.product) : null);
        return pId === productId;
    });

    if (itemIndex === -1) return;

    const currentQty = Number(window.userCart[itemIndex].quantity) || 1;
    const targetQty = currentQty - 1;

    if (targetQty <= 0) {
        window.userCart.splice(itemIndex, 1);
    } else {
        window.userCart[itemIndex].quantity = targetQty;
    }

    saveCartToStorage(window.userCart);
    updateNavbarCartCount();
    syncProductCardsUI();

    if (document.getElementById("cart-page-container")) {
        renderCartPage();
    }
    if (document.getElementById("checkout-page-container")) {
        renderCheckoutPage();
    }
}

// --- 9. Remove Cart Item (Cart Page) ---
function removeCartItem(productId) {
    if (!productId) return;

    window.userCart = window.userCart.filter((item) => {
        if (!item) return false;
        const pId = item.productId || (item.product ? (item.product._id || item.product) : null);
        return pId !== productId;
    });

    saveCartToStorage(window.userCart);
    updateNavbarCartCount();
    syncProductCardsUI();
    showToast("Item removed from cart.", "success");

    if (document.getElementById("cart-page-container")) {
        renderCartPage();
    }
    if (document.getElementById("checkout-page-container")) {
        renderCheckoutPage();
    }
}

// --- 10. Clear Entire Cart ---
function clearCart() {
    if (!confirm("Clear all items from your cart?")) return;

    window.userCart = [];
    clearCartStorage();
    updateNavbarCartCount();
    syncProductCardsUI();
    showToast("Cart cleared successfully.", "success");

    if (document.getElementById("cart-page-container")) {
        renderCartPage();
    }
    if (document.getElementById("checkout-page-container")) {
        renderCheckoutPage();
    }
}

// --- 11. Render Cart Page UI Dynamically ---
function renderCartPage() {
    const container = document.getElementById("cart-page-container");
    if (!container) return;

    const cart = window.userCart || [];
    const totalItems = getCartTotalItemCount();

    if (!cart || cart.length === 0) {
        container.innerHTML = `
            <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); padding: 4rem 2rem; text-align: center; max-width: 550px; margin: 3rem auto;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
                <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">Your Cart is Empty</h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 2rem;">
                    Looks like you haven't added any groceries to your cart yet.
                </p>
                <a href="/products" class="btn-primary" style="width: auto; padding: 0.85rem 2rem; display: inline-block;">
                    Explore Products
                </a>
            </div>
        `;
        return;
    }

    const itemsTotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
    const handlingCharge = 2;
    const grandTotal = itemsTotal + handlingCharge;

    const itemsHtml = cart.map((item) => {
        const prod = item.product || {};
        const pId = prod._id || item.productId || item.product;
        const pName = prod.name || item.name || "Grocery Item";
        const pPrice = Number(item.price) || Number(prod.price) || 0;
        const pImg = prod.image || item.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";
        const pUnit = prod.unit || item.unit || "1 unit";
        const qty = Number(item.quantity) || 1;

        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <img 
                        src="${pImg}" 
                        alt="${pName}" 
                        class="cart-item-img"
                        onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'"
                    >
                    <div>
                        <div class="cart-item-title">${pName}</div>
                        <div class="cart-item-price">
                            ${pUnit} • ₹${pPrice} each
                        </div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="qty-control">
                        <button class="qty-btn" onclick="handleDecreaseQty('${pId}')">-</button>
                        <span class="qty-number">${qty}</span>
                        <button class="qty-btn" onclick="handleIncreaseQty('${pId}', ${prod.quantity || 100})">+</button>
                    </div>

                    <div style="font-weight: 800; min-width: 60px; text-align: right;">
                        ₹${pPrice * qty}
                    </div>

                    <button 
                        onclick="removeCartItem('${pId}')" 
                        style="background: transparent; border: none; color: var(--text-light); cursor: pointer; font-size: 1.1rem;"
                        title="Remove Item"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join("");

    container.innerHTML = `
        <div class="cart-layout">
            <!-- Left: Cart Items List -->
            <div class="cart-items-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
                    <span style="font-weight: 700; color: var(--text-muted); font-size: 0.9rem;">
                        ${totalItems} Items in Cart
                    </span>
                    <button 
                        onclick="clearCart()" 
                        style="background: transparent; border: none; color: #ef4444; font-size: 0.85rem; font-weight: 700; cursor: pointer;"
                    >
                        Clear Cart ✕
                    </button>
                </div>

                ${itemsHtml}
            </div>

            <!-- Right: Bill Summary & Checkout -->
            <div>
                <div class="bill-summary-card">
                    <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1.25rem;">Bill Summary</h3>
                    
                    <div class="bill-row">
                        <span>Item Total</span>
                        <span>₹${itemsTotal}</span>
                    </div>
                    
                    <div class="bill-row">
                        <span>Delivery Partner Fee</span>
                        <span style="color: var(--primary-color); font-weight: 700;">FREE</span>
                    </div>

                    <div class="bill-row">
                        <span>Handling Charge</span>
                        <span>₹${handlingCharge}</span>
                    </div>

                    <div class="bill-row bill-total">
                        <span>Grand Total</span>
                        <span>₹${grandTotal}</span>
                    </div>

                    <div style="margin-top: 1.5rem;">
                        <a href="/checkout" class="btn-primary">
                            Proceed to Checkout →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- 12. Render Checkout Page UI Dynamically ---
function renderCheckoutPage() {
    const container = document.getElementById("checkout-page-container");
    if (!container) return;

    const cart = window.userCart || [];
    if (!cart || cart.length === 0) {
        window.location.href = "/cart";
        return;
    }

    const itemsTotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
    const handlingCharge = 2;
    const grandTotal = itemsTotal + handlingCharge;

    const orderItemsHtml = cart.map((item) => {
        const prod = item.product || {};
        const pName = prod.name || item.name || "Grocery Item";
        const pPrice = Number(item.price) || Number(prod.price) || 0;
        const pImg = prod.image || item.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";
        const qty = Number(item.quantity) || 1;

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px dashed var(--border-color);">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${pImg}" style="width: 45px; height: 45px; object-fit: contain; border-radius: 4px; background: #fafafa;">
                    <div>
                        <div style="font-weight: 700; font-size: 0.9rem;">${pName}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Qty: ${qty} × ₹${pPrice}</div>
                    </div>
                </div>
                <div style="font-weight: 800;">
                    ₹${pPrice * qty}
                </div>
            </div>
        `;
    }).join("");

    const orderItemsContainer = document.getElementById("checkout-order-items");
    if (orderItemsContainer) {
        orderItemsContainer.innerHTML = orderItemsHtml;
    }

    const itemsCountElem = document.getElementById("checkout-items-count");
    if (itemsCountElem) {
        itemsCountElem.textContent = `(${getCartTotalItemCount()})`;
    }

    const totalElems = document.querySelectorAll(".checkout-grand-total");
    totalElems.forEach((el) => (el.textContent = `₹${grandTotal}`));

    const itemsTotalElems = document.querySelectorAll(".checkout-items-total");
    itemsTotalElems.forEach((el) => (el.textContent = `₹${itemsTotal}`));
}

// --- 13. DOM Event Listeners & Form Handlers ---
document.addEventListener("DOMContentLoaded", () => {
    // A. Fetch cart from backend to sync state
    fetchUserCart();

    // B. Registration Form Submit Handler
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

    // C. Login Form Submit Handler
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

    // D. Checkout Form Submit Handler
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!window.userCart || window.userCart.length === 0) {
                showToast("Your cart is empty.", "error");
                return;
            }

            const placeBtn = document.getElementById("place-order-btn");
            if (placeBtn) {
                placeBtn.disabled = true;
                placeBtn.textContent = "Placing Order...";
            }

            const address = checkoutForm.deliveryAddress ? checkoutForm.deliveryAddress.value : "";

            try {
                const orderPayload = {
                    address,
                    items: window.userCart.map((item) => ({
                        productId: item.productId || (item.product ? (item.product._id || item.product) : null),
                        quantity: Number(item.quantity) || 1
                    }))
                };

                const res = await fetch("/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(orderPayload)
                });

                const data = await res.json();
                if (data.success) {
                    window.userCart = [];
                    clearCartStorage();
                    updateNavbarCartCount();

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
                showToast("Server error placing order.", "error");
                if (placeBtn) {
                    placeBtn.disabled = false;
                    placeBtn.textContent = "Place Order";
                }
            }
        });
    }

    // E. Clear localStorage cart on logout
    const logoutLinks = document.querySelectorAll('a[href="/logout"]');
    logoutLinks.forEach((link) => {
        link.addEventListener("click", () => {
            clearCartStorage();
        });
    });
});

// --- 14. Order Actions Handlers ---
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


