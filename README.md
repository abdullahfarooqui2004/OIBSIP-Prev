# 🍕 Pizza Co. — Full-Stack Real-Time Pizza Ordering & Store Operations Platform

A modern, production-grade full-stack MERN application for custom pizza ordering, automated kitchen inventory management, real-time WebSockets delivery tracking, and Razorpay test checkout.

---

## 🌟 Highlights & Capabilities

### 🍕 Customer Experience
- **Interactive 4-Step Pizza Studio**:
  - **Step 1: Crust Base**: Select from 5 artisanal crust bases (Classic Thin, Hand Tossed, Cheese Burst, Whole Wheat, Gluten-Free).
  - **Step 2: Sauce**: Simmered sauces (Marinara, Pesto, Barbeque, Alfredo, Spicy Arrabbiata).
  - **Step 3: Cheese**: Artisanal cheeses (Mozzarella, Cheddar, Parmesan).
  - **Step 4: Veggies**: Multi-select farm-fresh toppings with live price calculations.
- **Order Checkout & Coupons**:
  - Dynamic server-side price recalculation (tamper-proof pricing).
  - GST tax calculation and automatic delivery fee waivers.
  - Promo coupon support (`PIZZA50` for ₹50 off, `FREEDEL` for free delivery).
  - Address & phone profile persistence.
- **Razorpay Test Checkout**:
  - Modal checkout integration.
  - Server-side cryptographic HMAC-SHA256 signature verification.
  - Immediate atomic inventory stock decrements upon confirmed payment.
- **Live 4-Stage Order Tracking**:
  - Real-time WebSockets tracking stepper (`Order Received` ➔ `In Kitchen` ➔ `Sent to Delivery` ➔ `Delivered`).
  - Celebratory banner and instant reorder options upon delivery.
- **Customer Order History (`/orders`)**:
  - Active orders live monitor with direct tracking link.
  - Itemized recipe history with timestamps.
  - One-click **"Reorder Pizza"** restoring exact recipes to the studio.
- **Authentication & Security**:
  - JWT authentication with secure role-based route guards.
  - User registration with 24-hour cryptographic email verification links via Nodemailer.
  - Expiring password reset links (15-minute token expiry).

### 🛠️ Admin Store Operations Console (`/admin/dashboard`)
- **Segregated Staff Portal**: Isolated admin login endpoint preventing privilege escalation.
- **Live Inventory Dashboard (Full CRUD)**:
  - Real-time stock levels for bases, sauces, cheeses, and veggies.
  - **Add New Ingredient Modal**: Direct ingredient provisioning with validation and live state updates.
  - **Inline Editing & Quick Adjusters**: Instant manual adjustments of stock, price, and safety thresholds.
  - **Ingredient Deletion**: Safe deletion with referential integrity preserving historical orders.
  - **Automated Low-Stock Alerts**: Scheduled `node-cron` background job and manual trigger evaluating inventory against safety thresholds (dispatches email alerts).
- **Kitchen Order Management Queue**:
  - Live order feed listening to `newOrder` socket events.
  - Real-time status progression controller (`Order Received`, `In Kitchen`, `Sent to Delivery`, `Delivered`).
  - Visually distinct status tags and KPI metrics (Total Revenue, Active Queue, Low Stock Count).

---

## 🏗️ Architecture & Real-Time Flow

```
[ Customer Browser ] ────( HTTP REST )────> [ Express API Server ] ────> [ MongoDB ]
       │                                            │
   (WebSockets)                                (node-cron)
       │                                            │
       ▼                                            ▼
[ Socket.io Room ] <───( Status Updates )─── [ Admin Console ] ────> [ Nodemailer (Alerts) ]
       ▲
       │
[ Razorpay Webhook/Callback ] ──( HMAC-SHA256 Verification )──> Auto-Decrement Stock
```

---

## 💻 Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4 | High-performance reactive UI with Facebook-inspired clean theme |
| **Icons & Design** | Lucide React | Modern visual indicators and progress step icons |
| **Client Routing** | React Router DOM v7 | Route protection via `ProtectedRoute` and `AdminRoute` |
| **Backend** | Node.js (ESM), Express.js | Modular RESTful API architecture |
| **Database** | MongoDB & Mongoose ODM | Schema validation, relational references, and population |
| **Real-Time** | Socket.io & Socket.io Client | Bidirectional room-based WebSocket event broadcasting |
| **Payments** | Razorpay SDK (Test Mode) | Secure checkout and HMAC-SHA256 cryptographic verification |
| **Background Jobs** | `node-cron` | Periodic threshold-based inventory health audits |
| **Mailing** | `nodemailer` | HTML transactional emails for verification, resets, and alerts |
| **Security** | `bcryptjs`, `jsonwebtoken`, `cors` | Password hashing, stateless tokens, and strict CORS handling |

---

## 📁 Repository Structure

```
PizzaDelivery/
├── .gitignore                     # Root gitignore protecting all secrets & dependencies
├── README.md                      # Comprehensive project documentation
├── server/                        # Backend REST API & WebSockets server
│   ├── .env.example               # Sanitized server environment template
│   ├── .gitignore                 # Server-specific ignore rules
│   ├── package.json
│   ├── index.js                   # Application entrypoint & MongoDB connection
│   └── src/
│       ├── app.js                 # Express app, CORS configuration & Socket.io mounting
│       ├── socket.js              # Socket.io connection logic & room listeners
│       ├── config/
│       │   ├── db.js              # Mongoose connection utility
│       │   └── razorpay.js        # Razorpay SDK initialization
│       ├── controllers/
│       │   ├── auth.controller.js       # Register, login, email verify, password reset, profile
│       │   ├── inventory.controller.js  # Inventory CRUD, stock updates, cron triggers
│       │   ├── order.controller.js      # Razorpay order generation, signature verify, history
│       │   └── adminOrder.controller.js # Order queue fetch & live status transition
│       ├── jobs/
│       │   └── stockCron.js       # node-cron scheduled low-stock audit & alerts
│       ├── middlewares/
│       │   └── auth.middleware.js # JWT verification and requireAdmin role gate
│       ├── models/
│       │   ├── user.model.js      # User schema with roles and profile fields
│       │   ├── inventory.model.js # Ingredient schema with categories & thresholds
│       │   └── order.model.js      # Order schema with breakdown, statuses & deliveredAt
│       ├── routes/
│       │   ├── auth.route.js
│       │   ├── inventory.route.js
│       │   ├── order.route.js
│       │   └── adminOrder.route.js
│       ├── scripts/
│       │   ├── seedAdmin.js       # Initial admin account seeder
│       │   └── seedInventory.js   # Initial 19-ingredient catalog seeder
│       └── utils/
│           └── sendEmail.js       # Reusable Nodemailer transport
└── client/                        # Frontend React single-page application
    ├── .env.example               # Sanitized frontend environment template
    ├── .gitignore                 # Frontend-specific ignore rules
    ├── package.json
    ├── vite.config.js             # Vite configuration with backend proxy
    ├── index.html
    └── src/
        ├── App.jsx                # Application routing, layout, and global navigation
        ├── main.jsx
        ├── api/
        │   └── client.js          # Axios API instance with automatic auth headers
        ├── components/
        │   ├── ProtectedRoute.jsx # User authentication guard
        │   └── AdminRoute.jsx     # Admin role authorization guard
        ├── context/
        │   └── AuthContext.jsx    # User authentication provider with state sync
        ├── pages/
        │   ├── Dashboard.jsx      # Menu catalog and live active order monitor
        │   ├── PizzaBuilder.jsx   # 4-Step custom pizza studio
        │   ├── OrderSummary.jsx   # Checkout breakdown, coupons, and Razorpay modal
        │   ├── OrderTracking.jsx  # 4-stage real-time delivery tracking stepper
        │   ├── OrderHistory.jsx   # Customer order archive and 1-click reorder
        │   ├── auth/              # Register, VerifyEmail, Login, Forgot & Reset Password
        │   └── admin/
        │       ├── AdminLogin.jsx     # Isolated administrative login portal
        │       └── AdminDashboard.jsx # Inventory CRUD & kitchen order management
        └── utils/
            └── razorpay.js        # Razorpay modal launch helper
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.x, v20.x, or v22+ installed.
- **MongoDB**: A running local MongoDB instance (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.
- **Git**: Installed for source control.

---

### 2. Environment Variables Setup

#### Backend Configuration
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
Open `server/.env` and configure your credentials:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/pizza_app
JWT_SECRET=your_super_secret_jwt_key_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_16_digit_app_password
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ADMIN_EMAIL=admin@pizzaco.com
ADMIN_PASSWORD=Admin@123456
```

#### Frontend Configuration
Copy `client/.env.example` to `client/.env`:
```bash
cp client/.env.example client/.env
```
Default settings:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

### 3. Database Seeding

Populate the database with the initial 19 artisanal ingredients (5 bases, 5 sauces, 3 cheeses, 6 toppings) and provision the administrator account:

```bash
cd server
npm install
npm run seed
# Or seed separately:
node src/scripts/seedInventory.js
node src/scripts/seedAdmin.js
```

---

### 4. Running the Application

Open two separate terminals:

#### Terminal 1 — Backend API & Sockets Server
```bash
cd server
npm run dev
# Starts backend at http://localhost:5000 with WebSockets and cron active
```

#### Terminal 2 — Frontend Client
```bash
cd client
npm run dev
# Starts Vite dev server at http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Default Accounts & Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@pizzaco.com` | `Admin@123456` | Admin Console (`/admin/dashboard`), Inventory CRUD, Order Management Queue |
| **Verified Customer** | `customer@pizzaco.com` | `Admin@123456` | Pizza Studio, Checkout, Live Tracking, Order History (`/orders`) |

*(New customer accounts can be registered at `/register` and verified through Nodemailer confirmation links).*

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new customer; sends verification link |
| `GET` | `/api/auth/verify-email` | Public | Confirms account via token query param |
| `POST` | `/api/auth/login` | Public | Authenticates customer and returns JWT |
| `POST` | `/api/auth/admin/login` | Admin | Dedicated admin authentication enforcing admin role |
| `POST` | `/api/auth/forgot-password`| Public | Dispatches 15-minute expiring password reset link |
| `POST` | `/api/auth/reset-password` | Public | Sets new password via token payload |
| `PATCH`| `/api/auth/profile` | User | Updates phone number and default delivery address |

### 📦 Inventory Management (`/api/inventory`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/inventory` | Public / User | Fetches entire ingredient catalog |
| `POST` | `/api/inventory` | Admin | Adds new ingredient (`name`, `category`, `price`, `stock`, `threshold`) |
| `PATCH`| `/api/inventory/:id` | Admin | Updates ingredient stock, price, or safety threshold |
| `DELETE`| `/api/inventory/:id` | Admin | Safely deletes ingredient without breaking past orders |
| `POST` | `/api/inventory/check-low-stock` | Admin | Triggers manual threshold evaluation & dispatches alert email |

### 🍕 Customer Orders (`/api/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/create-razorpay-order` | User | Server recalculates total and creates Razorpay Order |
| `POST` | `/api/orders/verify-payment` | User | Validates HMAC-SHA256 signature and decrements stock |
| `GET` | `/api/orders/my-orders` | User | Fetches customer's order history sorted newest first |
| `GET` | `/api/orders/:id` | User / Admin | Returns single order details with populated recipe components |

### 👨‍🍳 Admin Operations (`/api/admin/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/orders` | Admin | Retrieves all store orders with customer and item details |
| `PATCH`| `/api/admin/orders/:id/status` | Admin | Advances order status and broadcasts real-time socket event |

---

## ⚡ WebSockets (Socket.io) Specification

| Event Name | Direction | Room | Payload Description |
| :--- | :--- | :--- | :--- |
| `joinOrderRoom` | Client ➔ Server | Order Room (`orderId`) | Subscribes client to live tracking for a specific order |
| `joinUserOrdersRoom` | Client ➔ Server | User Room (`user:<id>`) | Subscribes client to all updates on their active orders |
| `joinAdminRoom` | Client ➔ Server | `adminRoom` | Subscribes admin dashboard to incoming orders & status changes |
| `newOrder` | Server ➔ Admin | `adminRoom` | Pushes newly confirmed paid order to admin queue |
| `orderStatusUpdated` | Server ➔ Clients | Order & User Rooms | Broadcasts `{ orderId, status, deliveredAt }` |
| `inventoryUpdated` | Server ➔ Clients | Public Broadcast | Notifies builder and admin console of stock decrements |
| `inventoryCreated` | Server ➔ Clients | Public Broadcast | Notifies admin console of new ingredient provisioning |
| `inventoryDeleted` | Server ➔ Clients | Public Broadcast | Notifies admin console of ingredient removal |

---

## 🛡️ Security & Git Safety

This repository is pre-configured with strict security measures to prevent credential leaks:
- **Comprehensive `.gitignore`**: All `.env`, `.env.*`, `node_modules/`, `dist/`, logs, and temporary test artifacts are strictly excluded from source control.
- **Sanitized Templates**: `.env.example` templates contain only non-sensitive documentation placeholders.
- **Tamper-Proof Calculations**: Order totals are recomputed entirely server-side from inventory database records, ignoring any manipulated client pricing payloads.
- **Cryptographic Signatures**: Razorpay payments require HMAC-SHA256 signature verification prior to updating order status or decrementing stock.
- **Role Isolation**: Admin routes are protected by dual middleware (`protect` and `requireAdmin`), preventing regular user privilege escalation.

---

## 🧪 Verification & Quality Checks

Run the automated checks to confirm code quality:

```bash
# Frontend Linting
cd client
npm run lint

# Frontend Production Build
npm run build
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
