import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching latest registered users...");
  const users = await prisma.user.findMany({
    orderBy: {
      id: "desc"
    },
    take: 5
  });

  if (users.length === 0) {
    console.log("No users found in database.");
    return;
  }

  for (const u of users) {
    console.log(`\nEmail: ${u.email}`);
    console.log(`Role: ${u.role}`);
    console.log(`Name: ${u.name}`);
    console.log(`Password Hash: ${u.passwordHash}`);
    
    // We try to verify both common passwords just in case
    const matchPassword123 = await verifyPassword("password123", u.passwordHash);
    const matchPassword = await verifyPassword("password", u.passwordHash);
    console.log(`  Password 'password123' verification: ${matchPassword123}`);
    console.log(`  Password 'password' verification: ${matchPassword}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
