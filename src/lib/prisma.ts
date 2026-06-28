import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton for Next.js.
 *
 * The MVP runs on mock data (src/data/mock.ts) so this client is only
 * instantiated when DATABASE_URL is set and `prisma migrate` has been run.
 * Importing it without a DB connection will throw at first query — that's
 * expected and surfaces the missing config early.
 *
 * Usage (after running `npm run db:migrate` + `npm run db:seed`):
 *   import { prisma } from "@/lib/prisma";
 *   const products = await prisma.product.findMany({
 *     where: { status: "ACTIVE" },
 *     include: { category: true },
 *   });
 *
 * To swap a page from mock → DB, replace `import { products } from "@/data/mock"`
 * with a server-side `prisma.product.findMany(...)` call and pass the result as props.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
