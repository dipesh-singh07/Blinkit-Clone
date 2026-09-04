# 🛒 Blinkit Full-Stack Quick-Commerce Project

A complete, high-performance **Quick-Commerce Grocery Delivery** full-stack application inspired by Blinkit. Built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, **EJS templating**, **JWT authentication in HTTP-only cookies**, **Vanilla JavaScript (`localStorage` cart)**, and **Vanilla CSS**.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Prerequisites & Setup](#-prerequisites--setup)
6. [Running the Application](#-running-the-application)
7. [Demo Credentials](#-demo-credentials-seed-data)
8. [Database Models](#-database-models)
9. [Authentication & JWT Cookie Flow](#-authentication--jwt-cookie-flow)
10. [LocalStorage Shopping Cart Architecture](#-localstorage-shopping-cart-architecture)
11. [Order Creation & Security Validation](#-order-creation--security-validation)
12. [Complete API Reference](#-complete-api-reference)

---

## 🌟 Project Overview
This project simulates the core business logic of a quick-commerce app (like Blinkit or Zepto):
- **Customers** can browse items by category, search in real-time, manage their shopping cart via `localStorage`, adjust item quantities using dynamic steppers (`[ − Qty + ]`), checkout securely, and track/cancel orders.
- **Admins** have full inventory control: creating/editing/deleting products and categories, and managing store-wide order statuses.
- **Delivery Partners** can view active pending grocery orders and transition them to `out_for_delivery` and `delivered`.

---

## 🚀 Key Features

- **Authentication & Form Security:**
  - Password hashing with `bcrypt` (salt rounds: 10).
  - Signed JSON Web Tokens (JWT) stored securely in `HTTP-only` cookies (XSS protection).
  - Form validation with red `*` mandatory field indicators and HTML5 `required` attributes backed by server-side validation.
  - Role-based route protection middleware (`customer`, `admin`, `delivery`).

- **Client-Side LocalStorage Shopping Cart:**
  - Fast, client-side cart management stored in browser `localStorage` (`cart` key).
  - Dynamic quantity stepper controls: `[ ADD ]` converts into `[ − Qty + ]`.
  - Reverts to `[ ADD ]` when quantity reaches 0.
  - Real-time navbar cart counter badge reflecting total item count.
  - Zero database overhead for transient cart operations.

- **Order Creation & Price Validation:**
  - Order snapshot creation (`items`, `address`) upon checkout.
  - Backend MongoDB validation checks authoritative product availability and pricing from the database to prevent client tampering.
  - Instant `localStorage` cart clearance after order placement.

- **Admin & Delivery Portals:**
  - Admin dashboard with tabs for live orders, products, and categories.
  - Dedicated rider delivery screen for status transitions.

- **Blinkit-Style Frontend:**
  - Modern, responsive layout (mobile & desktop friendly).
  - Instant search and category filter pills.
  - Toast alerts for user actions and live price calculations.

---

## 🛠️ Tech Stack

### **Backend**
- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js 4.x
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** `jsonwebtoken` (JWT) + `bcrypt`
- **Cookies:** `cookie-parser`
- **Environment:** `dotenv`

### **Frontend**
- **Templating:** EJS (Embedded JavaScript)
- **Styling:** Vanilla CSS (Custom design system tokens, flexbox/grid, responsive layouts)
- **Client State & Logic:** Vanilla JavaScript (`localStorage`, `fetch()` API, DOM manipulation)

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
│   ├── Cart.js               # Legacy Cart model (kept for compatibility)
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
│   ├── cartController.js     # Cart view renderer
│   └── orderController.js    # Order checkout, price validation, admin & delivery dashboards
│
├── routers/
│   ├── authRoutes.js         # Routes for auth views & APIs
│   ├── productRoutes.js      # Routes for products & categories
│   ├── cartRoutes.js         # Route for cart page
│   └── orderRoutes.js        # Routes for orders, admin & delivery
│
├── utils/
│   ├── cartHelper.js         # Cart helper utilities
│   └── seed.js               # Sample groceries & demo users seeder
│
├── public/
│   ├── css/
│   │   └── style.css         # Blinkit theme stylesheet & stepper components
│   ├── js/
│   │   └── script.js         # Client LocalStorage cart manager & toasts
│   └── images/
│
├── views/
│   ├── partials/
│   │   ├── header.ejs        # HTML <head> and meta tags
│   │   ├── navbar.ejs        # Blinkit header, search, live cart counter
│   │   └── footer.ejs        # Footer links and script tag
│   ├── home.ejs              # Homepage with hero, categories & products
│   ├── register.ejs          # User signup form (validated with *)
│   ├── login.ejs             # User signin form (validated with *)
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
└── server.js                 # Server initialization & route mounting
```

---

## ⚙️ Prerequisites & Setup

1. Make sure you have **Node.js** (v16+) installed.
2. Ensure your **MongoDB** connection is running in `.env` (MongoDB Atlas or Local MongoDB):
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/blinkit
   JWT_SECRET=blinkit_super_secret_jwt_key_2026_learn_backend
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Seed Database with Sample Data:**
   Populate categories, products, and test accounts:
   ```bash
   npm run seed
   ```

---

## 🚀 Running the Application

- **Start the dev server:**
  ```bash
  npm run dev
  ```
  *(Or `node server.js`)*

- **Open in your browser:**
  ```
  http://localhost:3000
  ```

---

## 🔑 Demo Credentials (Seed Data)

The seeder creates 3 test accounts with password `password123`:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@blinkit.com` | `password123` | Browsing, Local Cart, Checkout, Order Tracking |
| **Admin** | `admin@blinkit.com` | `password123` | Product & Category CRUD, Order Statuses |
| **Delivery Rider** | `delivery@blinkit.com` | `password123` | Order pickup & delivery fulfillment |

---

## 🗄️ Database Models

### 1. `User.js`
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, hashed with bcrypt)
- `role` (String, enum: `["customer", "admin", "delivery"]`)
- `address` (String, required for customer order delivery)

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

### 4. `Order.js`
- `user` (ObjectId, ref: `"User"`)
- `items`: Snapshot array of products with server-verified prices
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

---

## 🛒 LocalStorage Shopping Cart Architecture

To optimize performance and eliminate DB latency for cart updates:
1. Products are fetched dynamically from the MongoDB backend (`Product.find()`).
2. When a user clicks **`ADD`** on a product card, the item details (`productId`, `name`, `price`, `image`, `unit`, `quantity`) are saved to browser `localStorage` under the `"cart"` key.
3. Quantity modifications (**`+`** / **`−`**) update `localStorage` state immediately and refresh the navbar item counter.
4. Cart contents persist seamlessly across page reloads and browser restarts.

---

## 🔒 Order Creation & Security Validation

When a user proceeds to checkout and submits an order:
1. Client sends the `localStorage` cart items and delivery address to `POST /orders`.
2. Backend middleware verifies the user's HTTP-only JWT auth cookie (`auth` middleware).
3. `orderController.js` validates each item against MongoDB (`Product.findById`).
4. Order prices are calculated server-side from authoritative MongoDB product records to prevent client-side price tampering.
5. On successful order creation in MongoDB, client `localStorage` cart is cleared and the user is redirected to `/orders`.

---

## 🌐 Complete API Reference

### **Authentication**
- `POST /register` - Register new user (requires `name`, `email`, `password`, `address`)
- `POST /login` - Log in and set HTTP-only JWT cookie
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

### **Shopping Cart & Checkout**
- `GET /cart` - Render cart view page
- `GET /checkout` - Render checkout page

### **Orders**
- `GET /orders` - View customer's order history
- `POST /orders` - Place order from `localStorage` cart items `{ items, address }`
- `PUT /orders/:id/cancel` - Cancel active order

### **Admin & Delivery**
- `GET /admin` - *(Admin)* Dashboard
- `PUT /admin/orders/:id/status` - *(Admin)* Change order status
- `GET /delivery` - *(Delivery)* Rider dashboard
- `PUT /delivery/orders/:id/status` - *(Delivery)* Update delivery progress
