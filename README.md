# MenuDirect — Digital Menu Ordering System

**Case Study 53: Backend Development** | Node.js + Express.js + MongoDB + Socket.io

A complete backend REST API for a digital restaurant ordering system where customers scan table QR codes to browse menus, place orders, and track their food in real time.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Seed the database with sample data
npm run seed

# 3. Start development server
npm run dev

# 4. Open browser at
# http://localhost:5000         <-- Interactive live demo
# http://localhost:5000/api/health <-- Health check
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | RESTful API web framework |
| **MongoDB** | NoSQL document database |
| **Mongoose** | MongoDB Object Data Modeling (ODM) & validation |
| **Socket.io** | Bi-directional WebSocket events for real-time kitchen updates |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **bcryptjs** | Salted password hashing |
| **qrcode** | Dynamic QR code generation for tables |
| **morgan** | HTTP request logger |
| **cors** | Cross-Origin Resource Sharing |
| **dotenv** | Environment variable management |

---

## 📁 Project Structure

```
Backend-Project/
├── server.js              # Entry point (Express + Socket.io server)
├── .env                   # Environment variables (port, db uri, jwt secret)
├── .env.example           # Template for .env
├── package.json           # Project dependencies & scripts
├── postman_collection.json # API endpoints collection for Postman
│
├── config/
│   └── db.js              # MongoDB Mongoose connection
│
├── models/                # Mongoose database schemas
│   ├── User.js            # User accounts & RBAC roles
│   ├── Table.js           # Restaurant tables & QR codes
│   ├── MenuItem.js        # Food items & categories
│   ├── Order.js           # Customer orders & statuses
│   ├── SplitBill.js       # Bill splitting logic
│   ├── KitchenTicket.js   # Kitchen Order Tickets (KOT)
│   └── Inventory.js       # Stock levels & auto-deduction
│
├── middleware/
│   ├── authMiddleware.js  # JWT token validation
│   ├── roleMiddleware.js  # Role-Based Access Control (RBAC)
│   └── errorMiddleware.js # 404 & global exception handling
│
├── controllers/           # Business logic & route handlers
│   ├── authController.js
│   ├── menuController.js
│   ├── tableController.js
│   ├── orderController.js
│   ├── splitBillController.js
│   ├── kitchenController.js
│   ├── inventoryController.js
│   ├── analyticsController.js
│   └── notificationController.js
│
├── routes/                # Express router endpoints
│   ├── authRoutes.js
│   ├── menuRoutes.js
│   ├── tableRoutes.js
│   ├── qrRoutes.js
│   ├── orderRoutes.js
│   ├── splitBillRoutes.js
│   ├── kitchenRoutes.js
│   ├── inventoryRoutes.js
│   ├── analyticsRoutes.js
│   ├── customizationRoutes.js
│   └── notificationRoutes.js
│
├── utils/
│   ├── qrGenerator.js     # Table QR Code generator helper
│   ├── socketEvents.js    # Socket.io rooms & event listeners
│   └── seed.js            # Database mock data seeder
│
└── public/
    ├── index.html         # Live interactive browser dashboard
    └── demo.js            # Real-time client Socket.io script
```

---

## 🔐 Demo Accounts (after running `npm run seed`)

| Role | Email | Password |
|---|---|---|
| **Manager** | manager@menudirect.com | password123 |
| **Staff / Waiter** | staff@menudirect.com | password123 |
| **Head Chef** | chef@menudirect.com | password123 |
| **Customer** | customer@menudirect.com | password123 |

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Retrieve logged-in user profile (Requires JWT)

### Menu Management (`/api/menus`)
- `GET /api/menus` — Browse available menu items
- `GET /api/menus/:id` — Get detailed information for a single dish
- `POST /api/menus` — Create new menu item (Staff/Manager only)
- `PUT /api/menus/:id` — Update menu item (Staff/Manager only)
- `DELETE /api/menus/:id` — Remove item from menu (Staff/Manager only)

### Tables & QR Codes (`/api/tables` & `/api/qr`)
- `GET /api/tables` — List all restaurant tables
- `POST /api/tables` — Add table and auto-generate QR code
- `GET /api/qr/table/:id` — QR Code scan landing endpoint

### Orders & Kitchen (`/api/orders` & `/api/kitchen`)
- `POST /api/orders` — Place customer order
- `GET /api/orders` — View order list (Staff/Manager)
- `GET /api/orders/:id` — Order status lookup
- `PUT /api/orders/:id/status` — Progress order (`preparing`, `ready`, `served`)
- `GET /api/kitchen` — Active Kitchen Order Tickets (KOT)
- `PUT /api/kitchen/:id` — Update ticket status in kitchen

### Split Billing (`/api/split-bill`)
- `POST /api/split-bill` — Split an order's bill (equally or custom shares)
- `GET /api/split-bill/order/:id` — Get current payment status of split bill
- `PUT /api/split-bill/:id/pay` — Settle an individual guest share

### Inventory Management (`/api/inventory`)
- `GET /api/inventory` — Monitor ingredients and stock levels
- `POST /api/inventory` — Register inventory items
- `PUT /api/inventory/:id` — Restock inventory
- `POST /api/inventory/auto-deduct` — Automatically deduct ingredients on order completion

### Analytics (`/api/analytics`)
- `GET /api/analytics/popular` — Top selling dishes report
- `GET /api/analytics/peak-hours` — Peak order time analysis

---

## ⚡ Real-Time Events (Socket.io)

### Client Events:
- `join_table(tableNumber)` — Subscribes device to updates for that specific table.
- `join_kitchen` — Subscribes kitchen monitor to incoming orders stream.

### Server Broadcasts:
- `new_order_received` $\rightarrow$ Kitchen room (instantly alerts chefs upon new order).
- `order_created` $\rightarrow$ Table room (confirms order placement to customer).
- `order_status_updated` $\rightarrow$ Table room (notifies customer when food is ready or served).
- `kitchen_order_updated` $\rightarrow$ Kitchen room (synchronizes all kitchen screens).
