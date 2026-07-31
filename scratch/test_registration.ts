import { hashPassword, verifyPassword } from "../src/lib/auth";

async function main() {
  const plainPassword = "myNewPassword123";
  
  console.log("Hashing password:", plainPassword);
  const hash = await hashPassword(plainPassword);
  console.log("Generated hash:", hash);
  
  console.log("Verifying password...");
  const isMatch = await verifyPassword(plainPassword, hash);
  console.log("Verification result:", isMatch);
}

main().catch(console.error);
