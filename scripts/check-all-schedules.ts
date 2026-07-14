import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        doctorSchedules: true,
      },
    });
    console.log("All Schedules:", JSON.stringify(schedules, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
