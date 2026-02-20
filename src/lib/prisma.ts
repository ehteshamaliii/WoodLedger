import { PrismaClient } from "../generated/prisma/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/woodledger";
const url = new URL(databaseUrl);

const poolConfig = {
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    connectionLimit: 15,
    idleTimeout: 60,
};

const globalForPrisma = globalThis as unknown as {
    prisma_v2: PrismaClient | undefined;
};

export const prisma =
    globalForPrisma.prisma_v2 ??
    new PrismaClient({
        adapter: new PrismaMariaDb(poolConfig),
        log:
            process.env.NODE_ENV === "development"
                ? ["error", "warn"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma_v2 = prisma;
}

export default prisma;
