import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking DB connection...");
    const users = await prisma.user.findMany({ take: 5 });
    console.log("Users in DB:", users);
  } catch (err) {
    console.error("DB Connection Failed with error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
