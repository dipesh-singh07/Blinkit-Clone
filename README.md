# 🛒 Blinkit Full-Stack Learning Backend Project

A complete, beginner-friendly **Quick-Commerce Grocery Delivery** full-stack application inspired by Blinkit. Built purposefully for **learning backend development** with Node.js, Express.js, MongoDB (Mongoose), EJS templating, JWT authentication in HTTP-only cookies, and Vanilla CSS/JS.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Prerequisites & MongoDB Setup](#-prerequisites--mongodb-setup)
6. [Installation & Setup](#-installation--setup)
7. [Running the Application](#-running-the-application)
8. [Demo Credentials](#-demo-credentials-seed-data)
9. [Database Models](#-database-models)
10. [Authentication & JWT Cookie Flow](#-authentication--jwt-cookie-flow)
11. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
12. [Complete API Reference](#-complete-api-reference)
13. [How Frontend Communicates with Backend](#-how-frontend-communicates-with-backend)

---

## 🌟 Project Overview
This project simulates the core business logic of a quick-commerce app (like Blinkit or Zepto):
- **Customers** can browse items by category, search in real-time, manage their cart, adjust quantities, checkout, and track/cancel orders.
- **Admins** have full inventory control: creating/editing/deleting products and categories, and managing store-wide order statuses.
- **Delivery Partners** can view active pending grocery orders and transition them to `out_for_delivery` and `delivered`.

---

## 🚀 Key Features

- **Authentication & Security:**
  - Password hashing with `bcrypt` (salt rounds: 10).
  - Signed JSON Web Tokens (JWT) stored securely in `HTTP-only` cookies (XSS protection).
  - Role-based route protection middleware (`customer`, `admin`, `delivery`).

- **Shopping Cart & Checkout:**
  - Dynamic cart with real-time total price calculation.
  - Cart item increment, decrement, removal, and complete clearance.
  - Snapshot order creation preserving price and item state at checkout.

- **Admin & Delivery Portals:**
  - Admin dashboard with tabs for live orders, products, and categories.
  - Dedicated rider delivery screen for status transitions.

- **Blinkit-Style Frontend:**
  - Responsive layout (mobile & desktop friendly).
  - Instant search and category filter pills.
  - Toast alerts for user actions and dynamic navbar cart badges.

---

## 🛠️ Tech Stack

### **Backend**
- **Runtime:** Node.js (CommonJS `require` / `module.exports`)
- **Framework:** Express.js 4.x
- **Database:** MongoDB (Local) with Mongoose ODM
- **Authentication:** `jsonwebtoken` (JWT) + `bcrypt`
- **Cookies:** `cookie-parser`
- **Environment:** `dotenv`

### **Frontend**
- **Templating:** EJS (Embedded JavaScript)
- **Styling:** Vanilla CSS (Custom tokens, flexbox/grid, responsive media queries)
- **Client Logic:** Vanilla JavaScript (`fetch()` API, DOM manipulation)

---

## 📁 Project Structure (MVC Architecture)

```
Blinkit-Clone/
│
├── config/
│   └── db.js                 # MongoDB connection logic (Mongoose)
│
├── models/
│   ├── User.js               # Customer, Admin, and Rider schema
│   ├── Category.js           # Grocery categories schema
│   ├── Product.js            # Products referencing Category ObjectId
│   ├── Cart.js               # User shopping carts schema & calculation
│   └── Order.js              # Orders with lifecycle status & address
│
├── middleware/
│   ├── auth.js               # JWT verification & optional auth middleware
│   ├── authorizeRoles.js     # Role-based access control middleware
│   └── errorHandler.js       # Centralized error handler
│
├── controllers/
│   ├── authController.js     # Registration, login, logout, profile
│   ├── productController.js  # Catalog, category, search, product CRUD
│   ├── cartController.js     # Cart items add/update/delete/clear
│   └── orderController.js    # Order checkout, admin & delivery dashboards
│
├── routers/
│   ├── authRoutes.js         # Routes for auth views & APIs
│   ├── productRoutes.js      # Routes for products & categories
│   ├── cartRoutes.js         # Routes for shopping cart
│   └── orderRoutes.js        # Routes for orders, admin & delivery
│
├── utils/
│   ├── cartHelper.js         # Cart count helper function
│   └── seed.js               # Sample groceries & demo users seeder
│
├── public/
│   ├── css/
│   │   └── style.css         # Blinkit theme stylesheet
│   ├── js/
│   │   └── script.js         # Client-side fetch() handler & toasts
│   └── images/
│
├── views/
│   ├── partials/
│   │   ├── header.ejs        # HTML <head> and meta tags
│   │   ├── navbar.ejs        # Blinkit header, search, cart counter
│   │   └── footer.ejs        # Footer links and script tag
│   ├── home.ejs              # Homepage with hero, categories & products
│   ├── register.ejs          # User signup form
│   ├── login.ejs             # User signin form
│   ├── dashboard.ejs         # Customer profile & quick actions
│   ├── products.ejs          # Catalog with search & category filters
│   ├── product-details.ejs   # Single item page with details
│   ├── cart.ejs              # Interactive cart with quantity controls
│   ├── checkout.ejs          # Address & order placement
│   ├── orders.ejs            # Customer order history & tracking
│   ├── admin.ejs             # Admin control panel
│   └── delivery.ejs          # Delivery partner dashboard
│
├── .env                      # Environment variables (PORT, MONGO_URI, JWT_SECRET)
├── .gitignore
├── package.json
├── README.md
└── server.js                 # Minimal server initialization & route mounting
```

---

## ⚙️ Prerequisites & MongoDB Setup

1. Make sure you have **Node.js** (v16+) installed.
2. Ensure your local **MongoDB** server is running at:
   ```
   mongodb://localhost:27017
   ```
   *(If using MongoDB Compass or brew services: `brew services start mongodb-community`)*

---

## 📦 Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Verify `.env` configuration:**
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/blinkit
   JWT_SECRET=blinkit_super_secret_jwt_key_2026_learn_backend
   ```

3. **Seed Database with Sample Data:**
   Run the seeder script to populate categories, products, and test accounts:
   ```bash
   npm run seed
   ```

---

## 🚀 Running the Application

- **Start the server:**
  ```bash
  node server.js
  ```
  *(Or `npm run dev` if you have nodemon)*

- **Open in your browser:**
  ```
  http://localhost:3000
  ```

---

## 🔑 Demo Credentials (Seed Data)

The seeder creates 3 test accounts with password `password123`:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@blinkit.com` | `password123` | Browsing, Cart, Checkout, Order Tracking |
| **Admin** | `admin@blinkit.com` | `password123` | Product & Category CRUD, Order Statuses |
| **Delivery Rider** | `delivery@blinkit.com` | `password123` | Order pickup & delivery fulfillment |

---

## 🗄️ Database Models

### 1. `User.js`
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, hashed with bcrypt)
- `role` (String, enum: `["customer", "admin", "delivery"]`)
- `address` (String)

### 2. `Category.js`
- `name` (String, required, unique)
- `description` (String)
- `image` (String)

### 3. `Product.js`
- `name` (String, required)
- `description` (String)
- `price` (Number, required)
- `image` (String)
- `category` (ObjectId, ref: `"Category"`)
- `quantity` (Number, stock count)
- `unit` (String, e.g. `"500 ml"`, `"1 kg"`, `"Pack of 4"`)
- `brand` (String)
- `isAvailable` (Boolean)

### 4. `Cart.js`
- `user` (ObjectId, ref: `"User"`, unique)
- `items`: Array of `{ product: ObjectId, quantity: Number, price: Number }`
- `totalPrice` (Number)

### 5. `Order.js`
- `user` (ObjectId, ref: `"User"`)
- `items`: Snapshot array of products
- `totalAmount` (Number)
- `address` (String)
- `status` (`"placed"` | `"confirmed"` | `"preparing"` | `"out_for_delivery"` | `"delivered"` | `"cancelled"`)
- `paymentStatus` (`"pending"` | `"paid"` | `"failed"`)
- `deliveryUser` (ObjectId, ref: `"User"`)

---

## 🔐 Authentication & JWT Cookie Flow

```
[User Submits Login Form]
          │
          ▼
   POST /login
          │
          ├─► 1. User.findOne({ email })
          ├─► 2. bcrypt.compare(password, user.password)
          ├─► 3. jwt.sign({ userId, role, name }, JWT_SECRET, { expiresIn: '7d' })
          ├─► 4. res.cookie("token", token, { httpOnly: true })
          └─► 5. Send JSON response with redirect URL
```

When a subsequent request is sent:
1. `middleware/auth.js` inspects `req.cookies.token` (or `Authorization: Bearer <token>`).
2. `jwt.verify(token, JWT_SECRET)` decodes the token payload into `req.user`.
3. `authorizeRoles("admin")` verifies if `req.user.role === "admin"`.

---

## 🌐 Complete API Reference

### **Authentication**
- `POST /register` - Register a new user
- `POST /login` - Log in and obtain HTTP-only JWT cookie
- `GET /logout` or `POST /logout` - Clear JWT cookie

### **Products & Categories**
- `GET /products` - Browse all products (supports `?search=milk&category=ID`)
- `GET /products/:id` - View single product details
- `GET /api/products/search?name=term` - API search endpoint
- `POST /products` - *(Admin)* Create product
- `PUT /products/:id` - *(Admin)* Update product
- `DELETE /products/:id` - *(Admin)* Delete product
- `GET /categories` - Get all categories
- `POST /categories` - *(Admin)* Create category
- `PUT /categories/:id` - *(Admin)* Update category
- `DELETE /categories/:id` - *(Admin)* Delete category

### **Shopping Cart**
- `GET /cart` - View cart page
- `GET /api/cart` - Fetch cart JSON
- `POST /cart/add` - Add item to cart `{ productId, quantity }`
- `PUT /cart/update/:productId` - Change item quantity `{ quantity }`
- `DELETE /cart/remove/:productId` - Remove item
- `DELETE /cart/clear` - Empty cart

### **Orders**
- `GET /orders` - View customer's orders
- `POST /orders` - Place order from cart `{ address }`
- `PUT /orders/:id/cancel` - Cancel active order

### **Admin & Delivery**
- `GET /admin` - *(Admin)* Dashboard
- `PUT /admin/orders/:id/status` - *(Admin)* Change order status
- `GET /delivery` - *(Delivery)* Rider dashboard
- `PUT /delivery/orders/:id/status` - *(Delivery)* Update delivery progress

---

## 🔄 How Frontend Communicates with Backend

1. **Server-Side Rendered (EJS):**
   - Express fetches data from MongoDB using Mongoose models (e.g. `Product.find()`).
   - Express injects the data directly into EJS templates:
     ```html
     <div class="product-price">₹<%= product.price %></div>
     ```

2. **Client-Side Fetch (`public/js/script.js`):**
   - Button click triggers `addToCart(productId)`:
     ```javascript
     const response = await fetch("/cart/add", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ productId, quantity: 1 })
     });
     const data = await response.json();
     if (data.success) {
         showToast("Added to cart!");
         updateNavbarCartCount(data.data.cartCount);
     }
     ```
   - The browser automatically attaches the `token` HTTP-only cookie with every `fetch()` request, ensuring secure authenticated communication.

---

## 🎓 Happy Backend Learning!
Everything in this codebase is structured to be readable, transparent, and easy to modify as you advance your backend Node.js and MongoDB skills.
# Blinkit-Clone
