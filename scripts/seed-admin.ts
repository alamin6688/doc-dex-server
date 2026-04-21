import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  try {
    const email = "dfg@gmail.com";
    const password = "admin123";

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("Admin already exists!");
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          needPasswordChange: false,
          admin: {
            create: {
              name: "Alamin",
              contactNumber: "01836429252",
            },
          },
        },
      });
    });

    console.log("✅ Super Admin beautifully seeded!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("❌ Failed to seed Super Admin:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
