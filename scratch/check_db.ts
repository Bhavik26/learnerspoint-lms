import { PrismaClient } from "@prisma/client";
import { pbkdf2Sync } from "crypto";

const prisma = new PrismaClient();

function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  const testHash = pbkdf2Sync(password, Buffer.from(salt, "hex"), 100000, 32, "sha256");
  return testHash.toString("hex") === key;
}

async function main() {
  console.log("Checking DB User accounts...");
  const users = await prisma.user.findMany();
  console.log(`Total users found: ${users.length}`);
  for (const u of users) {
    console.log(`- Email: ${u.email}, Role: ${u.role}, Name: ${u.name}`);
    if (u.email === "admin@learnerspoint.com" || u.email.startsWith("student")) {
      const match = verifyPassword("password", u.passwordHash);
      console.log(`  Password 'password' matches hash: ${match}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
