# 🪵 WoodLedger

> **Premium ERP for Furniture Manufacturers** — Orders, Inventory, Payments, and Client Management in one sleek dashboard.

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io)

</div>

---

## ✨ Features

| Module | Capabilities |
|---|---|
| **Orders** | Create orders with items, fabric/furniture types, advance tracking, invoice validation |
| **Payments** | Credit/Debit transactions, order linking, advance→payment redirect flow, balance enforcement |
| **Inventory** | Stock levels, low stock & out-of-stock alerts, image gallery with lightbox |
| **Clients** | Client profiles, contact management, order history |
| **Accounts** | Balance tracking, transaction history per account |
| **Reports** | PDF & CSV exports with branded templates |
| **Dashboard** | Drag & drop widgets, revenue charts, low stock alerts, production queue |
| **Auth** | Role-based access control (Admin, Sales, Inventory, Accountant) |
| **Real-time** | Socket.IO notifications, in-app notification center |
| **PWA** | Offline support via Service Worker + IndexedDB (Dexie.js) |

---

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Database:** MySQL 8 via Prisma ORM
- **Auth:** Custom session-based auth with bcrypt
- **Real-time:** Socket.IO with custom Node server
- **UI:** Radix UI + Tailwind CSS + Lucide Icons
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **PDF:** `@react-pdf/renderer`
- **Offline:** Service Worker + Dexie.js (IndexedDB)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8 running locally
- `npm` or `yarn`

### 1. Clone & Install

```bash
git clone https://github.com/your-org/woodledger.git
cd woodledger
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/woodledger"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set Up Database

```bash
# Run all migrations
npx prisma migrate deploy

# Seed with sample data (roles, permissions, admin user, sample orders/payments)
npx prisma db seed
```

### 4. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Default Login

| Field | Value |
|---|---|
| Email | `admin@woodledger.com` |
| Password | `admin123` |

> ⚠️ Change the admin password immediately after first login in a production environment.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # All dashboard pages
│   │   ├── orders/           # Order create, edit, view, print
│   │   ├── payments/         # Payment create, edit, view, list
│   │   ├── inventory/        # Stock management + image gallery
│   │   ├── clients/          # Client management
│   │   ├── accounts/         # Account & balance management
│   │   └── reports/          # Report generation
│   └── api/                  # REST API routes
│       ├── orders/
│       │   └── pending-payments/  # Orders with outstanding balance
│       ├── payments/
│       ├── inventory/
│       └── ...
├── components/
│   ├── shared/               # FormInput, FormSelect, PremiumCard, DataTable...
│   ├── dashboard/widgets/    # Revenue charts, low stock, stats cards
│   └── ui/                   # Radix-based primitives
├── lib/
│   ├── prisma.ts             # Prisma singleton
│   └── auth.ts               # Permission helpers
└── prisma/
    ├── schema.prisma          # Full data model
    ├── seed.ts                # Initial + sample data
    └── migrations/            # Migration history
```

---

## 💡 Key Business Rules

### Payments & Orders
- **Advance payment** on an order cannot exceed the order's invoice total (enforced client-side and server-side)
- When creating an order with an advance amount, you are **automatically redirected** to the payment form with pre-filled data — just select an account and save
- Payments can be **linked to orders** — the payments list shows the order number as a clickable badge
- An order **cannot be deleted** if it has payments linked to it — remove payments first

### Inventory
- Items at `quantity === 0` show an **Out of Stock** (red) state distinct from Low Stock
- Items at `quantity <= minQuantity` show a **Low Stock** warning

### Accounts
- Every payment (Credit or Debit) updates the linked account's balance in a **single Prisma transaction** to guarantee consistency
- Balance update is reversed atomically on payment deletion

---

## 🗄 Database Schema (Key Models)

```
User → Role → RolePermission → Permission
Order → OrderItem → FurnitureType
            └── FabricType (many-to-many)
Order ← Payment → Account
Stock → FurnitureType, FabricType
Stock → StockImage[]
```

---

## 🔄 Re-seeding

If you need to reset to a clean state with fresh sample data:

```bash
npx prisma migrate reset
# Confirms reset, runs all migrations, and runs seed automatically
```

Or just re-run the seed on an existing DB:

```bash
npx prisma db seed
```

---

---

## 👨‍💻 Owner
**Design & Developed by [Ehtesham Ali](https://github.com/ehteshamaliii)**

---

## 🏗 Deployment & Production

To deploy WoodLedger to a production server (Ubuntu/VPS):

### 1. Environment Preparation
Ensure Node.js 18+ and MySQL 8+ are installed.

### 2. Deployment Steps
```bash
# Clone and install dependencies
git clone https://github.com/ehteshamaliii/WoodLedger.git
cd woodledger
npm install --production=false

# Setup environment variables
cp .env.example .env
# Edit .env with production database and session secrets
nano .env

# Run migrations to setup production schema
npx prisma migrate deploy

# Build the optimized Next.js application
npm run build

# Start with a process manager (like PM2)
pm2 start npm --name "woodledger" -- start
```

### 3. Database Maintenance
- Regular backups of the MySQL database are recommended.
- Use `npx prisma studio` locally to manage data if needed via a tunnel.

---

## 📝 License

MIT License — See [LICENSE](file:///f:/Sites/woodledger/LICENSE) for details.
