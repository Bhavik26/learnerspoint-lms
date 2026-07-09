import { verifyPassword, hashPassword } from "../src/lib/auth";

async function main() {
  const storedHash = "17e20d84aa62349d20d83207f226cccf:75b3b4629f5f24ba37678dd1db132e6d71f1db018e6c5b9319f4408868116001";
  
  const passwordsToTest = ["123456", "12345678", "password", "password123"];
  for (const pw of passwordsToTest) {
    const isValid = await verifyPassword(pw, storedHash);
    console.log(`Password "${pw}" matches stored hash?`, isValid);
  }

  // Create a new hash for "123456" and display it
  const newHash = await hashPassword("123456");
  console.log("Newly generated hash for '123456':", newHash);
  
  const testNewHash = await verifyPassword("123456", newHash);
  console.log("Verify new hash with '123456':", testNewHash);
}

main().catch(console.error);
