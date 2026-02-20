// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...");

    // ============================================
    // CREATE PERMISSIONS
    // ============================================
    console.log("Creating permissions...");

    const permissionsData = [
        // Users module
        { name: "users.view", description: "View users list", module: "users" },
        { name: "users.create", description: "Create new users", module: "users" },
        { name: "users.edit", description: "Edit existing users", module: "users" },
        { name: "users.delete", description: "Delete users", module: "users" },

        // Roles module
        { name: "roles.view", description: "View roles and permissions", module: "roles" },
        { name: "roles.manage", description: "Create, edit, delete roles", module: "roles" },

        // Orders module
        { name: "orders.view", description: "View orders list", module: "orders" },
        { name: "orders.create", description: "Create new orders", module: "orders" },
        { name: "orders.edit", description: "Edit existing orders", module: "orders" },
        { name: "orders.delete", description: "Delete orders", module: "orders" },

        // Inventory module
        { name: "inventory.view", description: "View inventory/stock", module: "inventory" },
        { name: "inventory.create", description: "Add new stock items", module: "inventory" },
        { name: "inventory.edit", description: "Edit stock items", module: "inventory" },
        { name: "inventory.delete", description: "Delete stock items", module: "inventory" },

        // Payments module
        { name: "payments.view", description: "View payments and receipts", module: "payments" },
        { name: "payments.create", description: "Create new payments", module: "payments" },
        { name: "payments.edit", description: "Edit payments", module: "payments" },
        { name: "payments.delete", description: "Delete payments", module: "payments" },

        // Clients module
        { name: "clients.view", description: "View clients list", module: "clients" },
        { name: "clients.create", description: "Create new clients", module: "clients" },
        { name: "clients.edit", description: "Edit client details", module: "clients" },
        { name: "clients.delete", description: "Delete clients", module: "clients" },

        // Reports module
        { name: "reports.view", description: "View reports and analytics", module: "reports" },
        { name: "reports.export", description: "Export reports (CSV/PDF)", module: "reports" },

        // Settings module
        { name: "settings.view", description: "View system settings", module: "settings" },
        { name: "settings.edit", description: "Edit system settings", module: "settings" },

        // Fabric/Furniture types
        { name: "types.view", description: "View fabric and furniture types", module: "types" },
        { name: "types.manage", description: "Manage fabric and furniture types", module: "types" },
    ];

    const permissions = await Promise.all(
        permissionsData.map((p) =>
            prisma.permission.upsert({
                where: { name: p.name },
                update: {},
                create: p,
            })
        )
    );

    console.log(`✅ Created ${permissions.length} permissions`);

    // ============================================
    // CREATE ROLES
    // ============================================
    console.log("Creating roles...");

    // Admin role - all permissions
    const adminRole = await prisma.role.upsert({
        where: { name: "Admin" },
        update: {},
        create: {
            name: "Admin",
            description: "Full system access - can manage everything",
        },
    });

    // Assign all permissions to Admin
    await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
    await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
            roleId: adminRole.id,
            permissionId: p.id,
        })),
    });

    // Sales role
    const salesRole = await prisma.role.upsert({
        where: { name: "Sales" },
        update: {},
        create: {
            name: "Sales",
            description: "Sales team - manage orders and clients",
        },
    });

    const salesPermissions = permissions.filter((p) =>
        ["orders.view", "orders.create", "orders.edit", "clients.view", "clients.create", "clients.edit", "types.view", "payments.view", "payments.create"].includes(p.name)
    );

    await prisma.rolePermission.deleteMany({ where: { roleId: salesRole.id } });
    await prisma.rolePermission.createMany({
        data: salesPermissions.map((p) => ({
            roleId: salesRole.id,
            permissionId: p.id,
        })),
    });

    // Inventory Manager role
    const inventoryRole = await prisma.role.upsert({
        where: { name: "Inventory Manager" },
        update: {},
        create: {
            name: "Inventory Manager",
            description: "Inventory management - manage stock and types",
        },
    });

    const inventoryPermissions = permissions.filter((p) =>
        ["inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "types.view", "types.manage", "orders.view"].includes(p.name)
    );

    await prisma.rolePermission.deleteMany({ where: { roleId: inventoryRole.id } });
    await prisma.rolePermission.createMany({
        data: inventoryPermissions.map((p) => ({
            roleId: inventoryRole.id,
            permissionId: p.id,
        })),
    });

    // Accountant role
    const accountantRole = await prisma.role.upsert({
        where: { name: "Accountant" },
        update: {},
        create: {
            name: "Accountant",
            description: "Finance team - manage payments and reports",
        },
    });

    const accountantPermissions = permissions.filter((p) =>
        ["payments.view", "payments.create", "payments.edit", "payments.delete", "orders.view", "clients.view", "reports.view", "reports.export"].includes(p.name)
    );

    await prisma.rolePermission.deleteMany({ where: { roleId: accountantRole.id } });
    await prisma.rolePermission.createMany({
        data: accountantPermissions.map((p) => ({
            roleId: accountantRole.id,
            permissionId: p.id,
        })),
    });

    console.log("✅ Created 4 roles: Admin, Sales, Inventory Manager, Accountant");

    // ============================================
    // CREATE INITIAL ADMIN USER
    // ============================================
    console.log("Creating initial admin user...");

    const adminPassword = await bcrypt.hash("admin123", 12);

    const adminUser = await prisma.user.upsert({
        where: { email: "admin@woodledger.com" },
        update: {},
        create: {
            name: "Admin User",
            email: "admin@woodledger.com",
            passwordHash: adminPassword,
            roleId: adminRole.id,
            isActive: true,
        },
    });

    console.log("✅ Created admin user:");
    console.log("   Email: admin@woodledger.com");
    console.log("   Password: admin123");

    // ============================================
    // CLEAR SAMPLE DATA
    // ============================================
    console.log("Cleaning dynamic data for fresh seed...");
    await prisma.activityLog.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.client.deleteMany();

    // ============================================
    // CREATE SAMPLE FURNITURE TYPES
    // ============================================
    console.log("Creating sample furniture types...");

    const furnitureTypes = [
        { name: "Sofa", description: "Living room sofas and couches" },
        { name: "Bed", description: "Beds and bed frames" },
        { name: "Chair", description: "Dining and office chairs" },
        { name: "Table", description: "Dining, coffee, and side tables" },
        { name: "Cabinet", description: "Storage cabinets and wardrobes" },
        { name: "Desk", description: "Office and study desks" },
    ];

    await Promise.all(
        furnitureTypes.map((ft) =>
            prisma.furnitureType.upsert({
                where: { name: ft.name },
                update: {},
                create: ft,
            })
        )
    );

    console.log(`✅ Created ${furnitureTypes.length} furniture types`);

    // ============================================
    // CREATE SAMPLE FABRIC TYPES
    // ============================================
    console.log("Creating sample fabric types...");

    const fabricTypes = [
        { name: "Velvet", description: "Luxurious velvet fabric" },
        { name: "Leather", description: "Genuine leather upholstery" },
        { name: "Cotton", description: "Natural cotton fabric" },
        { name: "Linen", description: "Premium linen fabric" },
        { name: "Polyester", description: "Durable polyester blend" },
        { name: "Suede", description: "Soft suede material" },
    ];

    await Promise.all(
        fabricTypes.map((ft) =>
            prisma.fabricType.upsert({
                where: { name: ft.name },
                update: {},
                create: ft,
            })
        )
    );

    console.log(`✅ Created ${fabricTypes.length} fabric types`);

    // ============================================
    // CREATE SAMPLE CLIENTS
    // ============================================
    console.log("Creating sample clients...");

    // Helper to ensure client exists
    async function ensureClient(data: { name: string; phone: string; email?: string; address?: string; notes?: string }) {
        const existing = await prisma.client.findFirst({ where: { phone: data.phone } });
        if (existing) return existing;
        return prisma.client.create({ data });
    }

    const clients = await Promise.all([
        ensureClient({
            name: "Ahmad Khan",
            phone: "0300-1234567",
            email: "ahmad@example.com",
            address: "123 Main Street, Lahore",
            notes: "Preferred customer",
        }),
        ensureClient({
            name: "Sara Ali",
            phone: "0321-9876543",
            email: "sara.ali@example.com",
            address: "456 Garden Road, Karachi",
        }),
        ensureClient({
            name: "Bilal Ahmed",
            phone: "0333-5555555",
            address: "789 Park Avenue, Islamabad",
        }),
        ensureClient({
            name: "Fatima Hassan",
            phone: "0345-1111111",
            email: "fatima@example.com",
            address: "321 Canal Road, Faisalabad",
        }),
        ensureClient({
            name: "Imran Shah",
            phone: "0300-9999999",
            address: "654 Mall Road, Rawalpindi",
            notes: "Corporate client for office furniture",
        }),
    ]);

    console.log(`✅ Created ${clients.length} sample clients`);

    // ============================================
    // CREATE SAMPLE ACCOUNTS
    // ============================================
    console.log("Creating sample accounts...");

    // Helper to ensure account exists
    async function ensureAccount(data: { name: string; type: "CLIENT" | "OTHER" | "VENDOR" | "LABOR" | "EXPENSE"; balance: number; details?: string }) {
        const existing = await prisma.account.findFirst({ where: { name: data.name } });
        if (existing) return existing;
        return prisma.account.create({ data });
    }

    const cashAccount = await ensureAccount({
        name: "Cash",
        type: "OTHER",
        balance: 50000,
        details: "Cash on hand",
    });

    const bankAccount = await ensureAccount({
        name: "Bank Account",
        type: "OTHER",
        balance: 200000,
        details: "Main business bank account",
    });

    const clientAccount = await ensureAccount({
        name: "Client Receivables",
        type: "CLIENT",
        balance: 0,
        details: "Track client payments",
    });

    console.log("✅ Created 3 sample accounts");

    // Now we need to get the created furniture and fabric types to use in orders and stock
    const allFurnitureTypes = await prisma.furnitureType.findMany();
    const allFabricTypes = await prisma.fabricType.findMany();

    // ============================================
    // CREATE SAMPLE ORDERS
    // ============================================
    console.log("Creating sample orders...");

    const order1 = await prisma.order.upsert({
        where: { orderNumber: "ORD-20260101-001" },
        update: {},
        create: {
            orderNumber: "ORD-20260101-001",
            clientId: clients[0].id,
            deliveryDate: new Date("2026-02-15"),
            totalPrice: 45000,
            advancePayment: 15000,
            status: "CONFIRMED",
            notes: "Customer wants dark brown finish",
            items: {
                create: [
                    {
                        furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Sofa")!.id,
                        fabricTypes: { connect: [{ id: allFabricTypes.find((ft) => ft.name === "Velvet")!.id }] },
                        quantity: 1,
                        price: 35000,
                        notes: "3-seater sofa",
                    },
                    {
                        furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Table")!.id,
                        fabricTypes: { connect: [{ id: allFabricTypes.find((ft) => ft.name === "Cotton")!.id }] },
                        quantity: 1,
                        price: 10000,
                        notes: "Coffee table",
                    },
                ],
            },
        },
    });

    const order2 = await prisma.order.upsert({
        where: { orderNumber: "ORD-20260202-001" },
        update: {},
        create: {
            orderNumber: "ORD-20260202-001",
            clientId: clients[1].id,
            deliveryDate: new Date("2026-03-01"),
            totalPrice: 80000,
            advancePayment: 30000,
            status: "IN_PRODUCTION",
            items: {
                create: [
                    {
                        furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Bed")!.id,
                        fabricTypes: { connect: [{ id: allFabricTypes.find((ft) => ft.name === "Leather")!.id }] },
                        quantity: 1,
                        price: 60000,
                        notes: "King size bed with headboard",
                    },
                    {
                        furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Cabinet")!.id,
                        fabricTypes: { connect: [{ id: allFabricTypes.find((ft) => ft.name === "Cotton")!.id }] },
                        quantity: 2,
                        price: 10000,
                        notes: "Bedside tables",
                    },
                ],
            },
        },
    });

    const order3 = await prisma.order.upsert({
        where: { orderNumber: "ORD-20260203-001" },
        update: {},
        create: {
            orderNumber: "ORD-20260203-001",
            clientId: clients[4].id,
            deliveryDate: new Date("2026-02-20"),
            totalPrice: 150000,
            advancePayment: 75000,
            status: "PENDING",
            notes: "Office furniture order - 5 desks and 6 chairs",
            items: {
                create: [
                    {
                        furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Desk")!.id,
                        fabricTypes: { connect: [{ id: allFabricTypes.find((ft) => ft.name === "Polyester")!.id }] },
                        quantity: 5,
                        price: 15000,
                        notes: "Executive desks with drawers",
                    },
                    {
                        furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Chair")!.id,
                        fabricTypes: { connect: [{ id: allFabricTypes.find((ft) => ft.name === "Leather")!.id }] },
                        quantity: 6,
                        price: 12500,
                        notes: "Executive office chairs",
                    },
                ],
            },
        },
    });

    console.log("✅ Created 3 sample orders with items");

    // ============================================
    // CREATE SAMPLE STOCK ITEMS
    // ============================================
    console.log("Creating sample stock items...");

    const stockItems = await Promise.all([
        prisma.stock.create({
            data: {
                productName: "Velvet 3-Seater Sofa - Grey",
                furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Sofa")!.id,
                fabricTypeId: allFabricTypes.find((ft) => ft.name === "Velvet")!.id,
                quantity: 5,
                createPrice: 28000,
                sellingPrice: 38000,
                minQuantity: 2,
            },
        }),
        prisma.stock.create({
            data: {
                productName: "Leather Office Chair - Black",
                furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Chair")!.id,
                fabricTypeId: allFabricTypes.find((ft) => ft.name === "Leather")!.id,
                quantity: 15,
                createPrice: 8000,
                sellingPrice: 12000,
                minQuantity: 5,
            },
        }),
        prisma.stock.create({
            data: {
                productName: "Wooden Dining Table - 6 Seater",
                furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Table")!.id,
                fabricTypeId: allFabricTypes.find((ft) => ft.name === "Cotton")!.id,
                quantity: 3,
                createPrice: 15000,
                sellingPrice: 22000,
                minQuantity: 2,
            },
        }),
        prisma.stock.create({
            data: {
                productName: "King Size Bed Frame - Leather Headboard",
                furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Bed")!.id,
                fabricTypeId: allFabricTypes.find((ft) => ft.name === "Leather")!.id,
                quantity: 2,
                createPrice: 40000,
                sellingPrice: 55000,
                minQuantity: 1,
            },
        }),
        prisma.stock.create({
            data: {
                productName: "Executive Desk - Walnut Finish",
                furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Desk")!.id,
                fabricTypeId: allFabricTypes.find((ft) => ft.name === "Polyester")!.id,
                quantity: 8,
                createPrice: 12000,
                sellingPrice: 18000,
                minQuantity: 3,
            },
        }),
        prisma.stock.create({
            data: {
                productName: "Wardrobe Cabinet - 3 Door",
                furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Cabinet")!.id,
                fabricTypeId: allFabricTypes.find((ft) => ft.name === "Linen")!.id,
                quantity: 4,
                createPrice: 20000,
                sellingPrice: 30000,
                minQuantity: 2,
            },
        }),
        prisma.stock.create({
            data: {
                productName: "Linen Accent Chair - Beige",
                furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Chair")!.id,
                fabricTypeId: allFabricTypes.find((ft) => ft.name === "Linen")!.id,
                quantity: 1,
                createPrice: 6000,
                sellingPrice: 9500,
                minQuantity: 3,
            },
        }),
        prisma.stock.create({
            data: {
                productName: "Suede Recliner Sofa - Brown",
                furnitureTypeId: allFurnitureTypes.find((ft) => ft.name === "Sofa")!.id,
                fabricTypeId: allFabricTypes.find((ft) => ft.name === "Suede")!.id,
                quantity: 6,
                createPrice: 32000,
                sellingPrice: 45000,
                minQuantity: 2,
            },
        }),
    ]);

    console.log(`✅ Created ${stockItems.length} stock items (including low stock items)`);

    // ============================================
    // CREATE SAMPLE PAYMENTS
    // ============================================
    console.log("Creating sample payments...");

    const payment1 = await prisma.payment.create({
        data: {
            accountId: cashAccount.id,
            orderId: order1.id,
            amount: 15000,
            type: "CREDIT",
            description: `Advance payment for order ${order1.orderNumber}`,
            date: new Date("2026-01-15"),
        },
    });

    // Update cash account balance
    await prisma.account.update({
        where: { id: cashAccount.id },
        data: { balance: { increment: 15000 } },
    });

    const payment2 = await prisma.payment.create({
        data: {
            accountId: bankAccount.id,
            orderId: order2.id,
            amount: 30000,
            type: "CREDIT",
            description: `Advance payment for order ${order2.orderNumber}`,
            date: new Date("2026-02-02"),
        },
    });

    await prisma.account.update({
        where: { id: bankAccount.id },
        data: { balance: { increment: 30000 } },
    });

    const payment3 = await prisma.payment.create({
        data: {
            accountId: bankAccount.id,
            orderId: order3.id,
            amount: 75000,
            type: "CREDIT",
            description: `Advance payment for order ${order3.orderNumber} - Corporate`,
            date: new Date("2026-02-03"),
        },
    });

    await prisma.account.update({
        where: { id: bankAccount.id },
        data: { balance: { increment: 75000 } },
    });

    // ============================================
    // CREATE HISTORICAL DATA (FOR TRENDS)
    // ============================================
    console.log("Creating historical data for trends...");
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    await prisma.order.create({
        data: {
            orderNumber: "ORD-HIST-001",
            clientId: clients[2].id,
            deliveryDate: lastMonth,
            totalPrice: 120000,
            advancePayment: 60000,
            status: "DELIVERED",
            createdAt: lastMonth,
            items: {
                create: [{
                    furnitureTypeId: allFurnitureTypes[0].id,
                    fabricTypes: { connect: [{ id: allFabricTypes[0].id }] },
                    quantity: 2,
                    price: 60000,
                }]
            }
        }
    });

    // ============================================
    // CREATE ACTIVITY LOGS
    // ============================================
    console.log("Creating activity logs...");
    await prisma.activityLog.createMany({
        data: [
            { userId: adminUser.id, action: "CREATE", entityType: "Order", details: { message: "Created order #ORD-20260203-001" } },
            { userId: adminUser.id, action: "UPDATE", entityType: "Stock", details: { message: "Updated quantity for 'Leather Office Chair'" } },
            { userId: adminUser.id, action: "CREATE", entityType: "Payment", details: { message: "Recorded corporate payment" } },
        ]
    });

    console.log("✅ Created historical data and activity logs");

    console.log("✅ Created 3 sample payments");

    console.log("\n🎉 Database seed completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - ${permissions.length} permissions`);
    console.log("   - 4 roles (Admin, Sales, Inventory Manager, Accountant)");
    console.log("   - 1 admin user");
    console.log(`   - ${furnitureTypes.length} furniture types`);
    console.log(`   - ${fabricTypes.length} fabric types`);
    console.log(`   - ${clients.length} sample clients`);
    console.log("   - 3 sample accounts (Cash, Bank, Client Receivables)");
    console.log("   - 3 sample orders with items");
    console.log(`   - ${stockItems.length} stock items`);
    console.log("   - 3 sample payments");

}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
