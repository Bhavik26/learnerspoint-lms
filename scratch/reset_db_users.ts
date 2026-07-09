import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting DB User cleaning task...");
  
  // Find all user IDs to delete
  const nonAdminUsers = await prisma.user.findMany({
    where: {
      email: {
        not: "admin@learnerspoint.com",
      },
    },
  });
  
  const userIds = nonAdminUsers.map(u => u.id);
  console.log(`Found ${userIds.length} non-admin users to delete.`);
  
  if (userIds.length > 0) {
    // Delete related transactional models to satisfy RESTRICT constraints
    await prisma.payment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.enrollment.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.cartItem.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.booking.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.certificate.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userXP.deleteMany({ where: { userId: { in: userIds } } });
    
    // Now delete the users safely
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: { in: userIds }
      }
    });
    
    console.log(`Successfully deleted ${deleteResult.count} registered student/instructor accounts.`);
  } else {
    console.log("No student profiles needed deletion.");
  }
  
  // List remaining users to verify
  const remaining = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log("Remaining accounts in DB:", remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
