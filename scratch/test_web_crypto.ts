import { verifyPassword } from "../src/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@learnerspoint.com" }
  });
  if (!user) {
    console.log("Admin user not found in DB!");
    return;
  }
  console.log("Stored hash in DB:", user.passwordHash);
  const result = await verifyPassword("password", user.passwordHash);
  console.log("verifyPassword('password') result:", result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
