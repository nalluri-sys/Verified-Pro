# Verified-Pro: Full-Stack E-Commerce Platform

A production-ready, full-stack e-commerce platform built with modern web technologies, featuring multi-role support, AI-powered quality verification, and optimized single-container deployment.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication & Security](#authentication--security)
- [Contributing](#contributing)

## 🎯 Overview

**Verified-Pro** is a comprehensive e-commerce solution designed for modern digital marketplaces. It provides a complete ecosystem for customers to shop, sellers to manage products, admins to oversee operations, and quality checkers to verify product authenticity using AI-powered verification systems.

### Project Type
- **Monorepo:** Multi-workspace structure using `pnpm` workspaces
- **Deployment:** Single-container deployment (Docker-based)
- **Scale:** Production-ready with role-based access control (RBAC)

---

## 📁 Project Structure

```
Verified-Pro/
├── artifacts/                  # Built applications & executables
│   ├── api-server/            # Express.js backend API server
│   ├── ecommerce/             # React frontend application
│   └── mockup-sandbox/        # Sandbox environment for testing
│
├── lib/                       # Shared libraries & common code
│   ├── db/                   # Database schemas & Mongoose models
│   ├── api-spec/             # OpenAPI 3.1.0 specification
│   ├── api-zod/              # Zod validation schemas (shared)
│   └── api-client-react/     # Auto-generated React Query hooks
│
├── scripts/                  # Build & utility scripts
├── attached_assets/          # Static assets & documentation
├── document/                 # Additional project documentation
│
├── Dockerfile               # Multi-stage Docker configuration
├── .env.example             # Environment variables template
├── package.json             # Root workspace configuration
├── pnpm-workspace.yaml      # pnpm monorepo configuration
├── tsconfig.base.json       # Shared TypeScript configuration
└── pnpm-lock.yaml          # Dependency lock file
```

### Directory Details

#### `/artifacts/api-server`
Express.js backend REST API server
- **Entry Point:** `src/index.ts` → `src/app.ts`
- **Port:** 3000 (configurable via `PORT` env)
- **Build Output:** `dist/index.cjs`

#### `/artifacts/ecommerce`
React frontend application
- **Entry Point:** `src/main.tsx` → `src/App.tsx`
- **Build Output:** `dist/public/` (consumed by backend)
- **Dev Server:** Vite with HMR support

#### `/lib/db`
Database layer with Mongoose schemas
- User, Product, Category, Order, Return schemas
- Type-safe database access

#### `/lib/api-spec`
OpenAPI specification for the REST API
- Auto-generates validation schemas and React Query hooks
- Used for code generation via Orval

#### `/lib/api-zod`
Shared Zod validation schemas across backend and frontend

#### `/lib/api-client-react`
Auto-generated React Query hooks for API communication

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 24 (ES2022 target)
- **Framework:** Express.js 5.x
- **Language:** TypeScript 5.9+
- **Database:** MongoDB + Mongoose 8.x
- **Authentication:** JWT (HS256, custom implementation)
- **Validation:** Zod
- **Bundler:** esbuild

### Frontend
- **Framework:** React 19.1.x
- **Build Tool:** Vite 7.x
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.x
- **State Management:** React Query + Zustand pattern
- **Form Handling:** React Hook Form
- **Routing:** Wouter (lightweight alternative to React Router)
- **UI Components:** Radix UI (30+ accessible primitives)

### DevOps & Infrastructure
- **Container:** Docker (Node 24 Alpine)
- **Package Manager:** pnpm v10+
- **Single-Port Deployment:** Backend serves both API and frontend static files

### Shared Tools
- **OpenAPI:** v3.1.0 specification
- **Code Generation:** Orval
- **Type Safety:** TypeScript strict mode
- **ORM:** Drizzle ORM support

---

## ✨ Key Features

### User Management
- User registration and authentication
- Role-based access control (RBAC)
- Multiple user roles: Customer, Seller, Admin, Checker
- JWT-based stateless authentication
- Profile management

### E-Commerce Core
| Feature | Details |
|---------|---------|
| **Product Catalog** | Full CRUD operations, categories, filtering |
| **Shopping Cart** | Add, update, remove items; persist cart state |
| **Orders** | Place orders, order history, order tracking, status updates |
| **Returns** | Request returns, track return status, view return details |
| **Payment Ready** | Backend structure ready for payment gateway integration |

### Role-Specific Dashboards

#### 👤 Customer Dashboard
- Browse products
- Manage shopping cart
- View order history
- Track order status
- Request and manage returns

#### 🏪 Seller Dashboard
- Product management (add, edit, delete)
- Sales analytics
- Order management
- Inventory tracking

#### 👨‍💼 Admin Dashboard
- User management
- System configuration
- Sales reporting
- Order oversight
- User role management

#### ✅ Quality Checker Dashboard
- AI-powered product verification
- Product authenticity checking via AI Verifier
- Verification report generation
- Batch checking capabilities

### AI-Powered Verification
- AI Verifier module (`lib/ai-verifier`)
- Automated product quality checking
- Authenticity verification
- Fraud detection support

---

## 🏗️ Architecture

### Frontend Architecture
```
React App (main.tsx)
    ↓
Wouter Router (client-side routing)
    ↓
Protected Routes (auth middleware)
    ↓
Pages (15 routes total)
    ↓
Components (Radix UI primitives)
    ↓
React Query (API communication)
    ↓
Backend API
```

### Backend Architecture
```
Express Server (index.ts)
    ↓
Middleware Stack (CORS, JSON limit, Auth)
    ↓
Route Handlers (Health, Auth, Products, Orders, etc.)
    ↓
Business Logic Layer
    ↓
Mongoose Models (MongoDB)
    ↓
Database
```

### Monorepo Dependency Flow
```
Frontend (ecommerce)
    ↓ (imports from)
├─ @workspace/api-client-react
│  ↓ (depends on)
│  └─ @workspace/api-spec
│
Backend (api-server)
    ↓ (imports from)
├─ @workspace/db
├─ @workspace/api-zod
└─ @workspace/api-spec
```

### Frontend Routes (15 Total)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Landing page |
| `/catalog` | Catalog | Product listing & browsing |
| `/product/:id` | ProductDetail | Individual product details |
| `/cart` | Cart | Shopping cart management |
| `/checkout` | Checkout | Order completion |
| `/orders` | Orders | Order history |
| `/orders/:id` | OrderDetail | Order details & tracking |
| `/returns` | ReturnRequest | Create return requests |
| `/returns/:id` | ReturnDetail | Return request details |
| `/login` | Login | User authentication |
| `/register` | Register | User registration |
| `/seller` | SellerDashboard | Seller operations |
| `/admin` | AdminDashboard | Admin operations |
| `/checker` | CheckerDashboard | Quality checker operations |
| `*` | NotFound | 404 error page |

### API Routes Structure
All routes prefixed with `/api`:

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

**Products**
- `GET /api/products` - List all products
- `POST /api/products` - Create product (seller)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product (seller)
- `DELETE /api/products/:id` - Delete product (seller)

**Categories**
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

**Shopping Cart**
- `GET /api/cart` - Get current cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove from cart

**Orders**
- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status (admin/seller)

**Returns**
- `POST /api/returns` - Create return request
- `GET /api/returns` - List returns
- `GET /api/returns/:id` - Get return details
- `PUT /api/returns/:id` - Update return status

**Seller Operations**
- `GET /api/seller/dashboard` - Seller statistics
- `GET /api/seller/products` - Seller's products
- `GET /api/seller/sales` - Sales data

**Admin Operations**
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - System statistics
- `PUT /api/admin/users/:id/role` - Change user role

**Quality Checker**
- `POST /api/checker/verify` - Verify product
- `GET /api/checker/verifications` - List verifications
- `GET /api/checker/reports` - Verification reports

**Health**
- `GET /api/health` - Server health check

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js:** v24.x or higher
- **pnpm:** v10.x or higher (`npm install -g pnpm`)
- **MongoDB:** Local or cloud instance (MongoDB Atlas)
- **Git:** For version control

### Step 1: Install Dependencies
```bash
cd Verified-Pro
pnpm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
# Server Configuration
PORT=3000
BASE_PATH=/api

# Database
MONGODB_URI=mongodb://localhost:27017/verified-pro
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/verified-pro

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Environment
NODE_ENV=development
```

### Step 3: Verify Installation
```bash
pnpm run health
```

---

## 👨‍💻 Development

### Available Scripts

#### Build Commands
```bash
# Build all packages
pnpm build

# Build for production deployment (frontend first, then backend)
pnpm build:deploy

# Build backend only
pnpm --filter api-server build

# Build frontend only
pnpm --filter ecommerce build
```

#### Development Commands
```bash
# Start development mode (both frontend and backend with HMR)
pnpm dev

# Start backend dev server only
pnpm --filter api-server dev

# Start frontend dev server only
pnpm --filter ecommerce dev

# Health check
pnpm run health
```

#### Testing & Linting
```bash
# Type check all packages
pnpm typecheck

# Lint code
pnpm lint

# Format code
pnpm format
```

### Development Workflow

1. **Start Backend Dev Server**
   ```bash
   pnpm --filter api-server dev
   ```
   - Runs on `http://localhost:3000`
   - Express with Vite middleware for frontend HMR

2. **Start Frontend Dev Server** (in another terminal)
   ```bash
   pnpm --filter ecommerce dev
   ```
   - Runs on `http://localhost:5173`
   - Hot Module Replacement (HMR) enabled

3. **Make Changes**
   - Frontend changes: Auto-reload via Vite HMR
   - Backend changes: Auto-restart with nodemon

4. **Test API**
   - Visit `http://localhost:5173` for frontend
   - API available at `http://localhost:3000/api`

### Key Development Files

| File | Purpose |
|------|---------|
| `artifacts/api-server/src/index.ts` | Backend entry point |
| `artifacts/ecommerce/src/main.tsx` | Frontend entry point |
| `artifacts/api-server/src/app.ts` | Express app configuration |
| `artifacts/ecommerce/src/App.tsx` | React app root component |
| `lib/api-spec/orval.config.ts` | API code generation config |
| `artifacts/ecommerce/vite.config.ts` | Frontend build config |

### Debugging
- **Backend:** Use VS Code debugger with `debug` launch configuration
- **Frontend:** Use React DevTools browser extension
- **Network:** Use browser DevTools Network tab to inspect API calls
- **Database:** Use MongoDB Compass to visualize data

---

## 🚀 Deployment

### Docker Deployment

#### Build Docker Image
```bash
# Build the Docker image
docker build -t verified-pro:latest .

# View available images
docker images | grep verified-pro
```

#### Run Container
```bash
# Run container with environment variables
docker run \
  -p 3000:3000 \
  -e PORT=3000 \
  -e MONGODB_URI=mongodb://mongo:27017/verified-pro \
  -e JWT_SECRET=your-production-secret \
  -e NODE_ENV=production \
  verified-pro:latest
```

#### Docker Compose (Recommended for full setup)
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete Docker Compose setup with MongoDB.

### Key Deployment Features
- **Single Container:** One container runs both API and frontend
- **Single Port:** Entire application accessible via port 3000
- **Zero Downtime:** Static frontend files cached efficiently
- **Alpine Base:** Minimal image size with Node 24 Alpine
- **Production Ready:** Optimized builds and secure defaults

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=<production-mongodb-uri>
JWT_SECRET=<strong-random-secret>
BASE_PATH=/api
CORS_ORIGIN=https://yourdomain.com
```

### Performance Optimization
- Frontend pre-built and served as static files from backend
- Vite optimized production build (tree-shaking, code splitting)
- Express serves gzipped assets
- MongoDB connection pooling
- JWT-based stateless auth (no session storage)

---

## 📖 API Documentation

### OpenAPI Specification
The complete API is documented in OpenAPI 3.1.0 format at:
- **File:** `lib/api-spec/openapi.yaml`
- **Format:** OpenAPI 3.1.0
- **Code Generation:** Powered by Orval

### Accessing API Documentation
1. After running the server, visit `http://localhost:3000/api/docs` (if Swagger UI is configured)
2. Or use the OpenAPI spec file directly in any API client (Postman, Insomnia, etc.)

### Authentication
All protected endpoints require JWT token in `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

### Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

---

## 🗄️ Database Schema

### Collections

#### Users Collection
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "password": "hashed-password",
  "role": "customer|seller|admin|checker",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "url"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Products Collection
```json
{
  "_id": "ObjectId",
  "name": "Product Name",
  "description": "Description",
  "price": 99.99,
  "category": "ObjectId (ref: Category)",
  "seller": "ObjectId (ref: User)",
  "images": ["url1", "url2"],
  "stock": 100,
  "verified": true,
  "rating": 4.5,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Orders Collection
```json
{
  "_id": "ObjectId",
  "orderNumber": "ORD-20240815-001",
  "customer": "ObjectId (ref: User)",
  "items": [
    {
      "product": "ObjectId",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "totalAmount": 199.98,
  "status": "pending|confirmed|shipped|delivered",
  "shippingAddress": "Address object",
  "paymentStatus": "pending|completed|failed",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Categories Collection
```json
{
  "_id": "ObjectId",
  "name": "Electronics",
  "description": "Electronic devices",
  "slug": "electronics",
  "icon": "url",
  "createdAt": "Date"
}
```

#### Returns Collection
```json
{
  "_id": "ObjectId",
  "order": "ObjectId (ref: Order)",
  "reason": "Defective|Not as described",
  "status": "requested|approved|rejected|completed",
  "refundAmount": 99.99,
  "createdAt": "Date",
  "approvedAt": "Date"
}
```

---

## 🔐 Authentication & Security

### Authentication Flow

1. **Registration**
   - User provides email, password, and basic info
   - Password hashed with bcrypt
   - Account created with default role (customer)

2. **Login**
   - User submits email and password
   - Server validates credentials
   - JWT token generated with 24-hour expiration
   - Token stored in client localStorage

3. **Protected Requests**
   - Client sends JWT in `Authorization: Bearer` header
   - Server validates token signature and expiration
   - Middleware extracts user info from token
   - Route handler processes request

### Security Features
- ✅ **JWT Authentication:** HS256 algorithm, 24-hour expiration
- ✅ **Password Hashing:** bcrypt with salt rounds
- ✅ **CORS Protection:** Configurable origins
- ✅ **Request Size Limits:** 15MB JSON/URL payload limits
- ✅ **Role-Based Access Control (RBAC):** Middleware-enforced roles
- ✅ **SQL Injection Prevention:** Mongoose schema validation
- ✅ **XSS Protection:** React's built-in XSS prevention
- ✅ **CSRF Protection:** Same-site cookie policy (when using cookies)

### Roles & Permissions

| Role | Permissions |
|------|------------|
| **Customer** | Browse products, create orders, request returns, manage cart |
| **Seller** | Manage own products, view sales, manage orders |
| **Admin** | User management, system config, sales reporting, role management |
| **Checker** | Verify products, generate verification reports, batch checking |

### Environment Variable Secrets
```env
JWT_SECRET=<change-in-production>
MONGODB_URI=<secure-connection-string>
```

⚠️ **IMPORTANT:** Never commit `.env` file with production secrets to version control!

---

## 📋 Frontend Components

### Layout Components
- `Layout` - Main application wrapper
- `Header` - Navigation header
- `Sidebar` - Navigation sidebar
- `Footer` - Footer component

### Shared Components (Radix UI based)
- `Button` - Accessible button
- `Card` - Content container
- `Form` - Form wrapper
- `Input` - Text input field
- `Select` - Dropdown selection
- `Modal` - Dialog/modal component
- `Toast` - Notification system
- `Tabs` - Tabbed interface
- `Table` - Data table
- `Pagination` - Pagination control

### Page Components
- **Home** - Landing page with featured products
- **Catalog** - Product listing with filters and search
- **ProductDetail** - Individual product with details and reviews
- **Cart** - Shopping cart with edit capabilities
- **Checkout** - Order confirmation and summary
- **Orders** - User's order history
- **OrderDetail** - Detailed order information and tracking
- **ReturnRequest** - Create and manage returns
- **ReturnDetail** - Return status and details
- **Login/Register** - Authentication pages
- **Dashboards** - Role-specific dashboards (Seller, Admin, Checker)

### Custom Hooks
- `useAuth()` - Authentication state and methods
- `useMobile()` - Mobile responsiveness detection
- `useToast()` - Toast notifications
- React Query hooks from `@workspace/api-client-react`

---

## 🔄 Backend Middleware

### Core Middleware (app.ts)
```typescript
// CORS handling
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Authentication
app.use(requireAuth());

// Request logging
app.use(requestLogger());
```

### Route Middleware
- `requireAuth()` - Validates JWT token
- `requireRole(...roles)` - Checks user role
- `errorHandler()` - Global error handling

---

## 🧪 Testing Endpoints

### With cURL
```bash
# Get health status
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### With Postman/Insomnia
1. Import OpenAPI spec: `lib/api-spec/openapi.yaml`
2. Set base URL: `http://localhost:3000`
3. After login, add JWT to Authorization header
4. Test endpoints directly

---

## 🤝 Contributing

### Development Guidelines
1. Use TypeScript strict mode
2. Follow existing code style
3. Create feature branches: `git checkout -b feature/your-feature`
4. Commit with clear messages: `git commit -m "feat: add new feature"`
5. Push to GitHub and create a Pull Request

### Code Quality
- Run type checking: `pnpm typecheck`
- Format code: `pnpm format`
- Follow ESLint rules: `pnpm lint`

### Project Dependencies
Managed via `pnpm-workspace.yaml`:
- Pin major versions for stability
- Use `^` for patch/minor updates
- Update lockfile: `pnpm install`

---

## 📚 Additional Documentation

- **Deployment Guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Specification:** See `lib/api-spec/openapi.yaml`
- **Database Schemas:** See `lib/db/src/schema/`
- **Project Assets:** See `attached_assets/`

---

## 📝 License

This project is proprietary and confidential.

---

## 🆘 Support & Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check MongoDB is running
mongod --version

# Update MONGODB_URI in .env
MONGODB_URI=mongodb://localhost:27017/verified-pro
```

**Port Already in Use**
```bash
# Change PORT in .env
PORT=3001
```

**Dependency Installation Issues**
```bash
# Clear pnpm cache and reinstall
pnpm install --force
```

**TypeScript Errors**
```bash
# Type check all packages
pnpm typecheck

# Fix TypeScript issues
pnpm tsc --noEmit
```

### Getting Help
- Check existing GitHub issues
- Review DEPLOYMENT.md for deployment issues
- Check MongoDB documentation for database issues
- Review Express.js and React documentation

---

## 🎉 Summary

**Verified-Pro** is a comprehensive, production-ready e-commerce platform built with modern technologies. It features:

✅ Full-stack TypeScript application  
✅ Multi-role user system with RBAC  
✅ AI-powered product verification  
✅ Single-container Docker deployment  
✅ OpenAPI-documented REST API  
✅ React 19 + Vite frontend  
✅ Express 5 + MongoDB backend  
✅ Monorepo structure for code sharing  

Perfect for deploying a modern e-commerce solution with verification capabilities and multiple stakeholder support.

---

**Last Updated:** 2024  
**Version:** 1.0.0  
**Repository:** https://github.com/nalluri-sys/Verified-Pro
