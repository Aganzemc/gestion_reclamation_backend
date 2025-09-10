// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Eviter le redeclare dans hot reload
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "info", "warn", "error"], // logs utiles
  });

if (process.env["NODE_ENV"] !== "production") {
  global.prisma = prisma;
}

// 🔎 Tester la connexion
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.info("✅ Connexion à la base de données réussie");
    return true;
  } catch (error) {
    console.error("❌ Échec de la connexion à la base de données:", error);
    return false;
  }
}

// 📴 Fermer Prisma proprement
export async function closePool(): Promise<void> {
  console.info("Fermeture de Prisma...");
  await prisma.$disconnect();
  console.info("✅ Prisma déconnecté");
}
