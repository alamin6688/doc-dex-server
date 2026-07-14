import bcrypt from "bcryptjs";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  try {
    const email = "admin@example.com";
    const password = "admin789";

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { admin: true },
    });

    if (existingUser) {
      await prisma.$transaction(async (tx) => {
        // Update User
        await tx.user.update({
          where: { email },
          data: {
            password: hashedPassword,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            needPasswordChange: false,
          },
        });

        // Ensure Admin Profile exists
        if (!existingUser.admin) {
          await tx.admin.create({
            data: {
              name: "Admin",
              email,
              contactNumber: "01836429252",
            },
          });
        }
      });
      console.log("✅ Admin user and profile updated successfully!");
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            needPasswordChange: false,
            admin: {
              create: {
                name: "Admin",
                contactNumber: "01836429252",
              },
            },
          },
        });
      });
      console.log("✅ Admin user and profile created successfully!");
    }

    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("❌ Failed to seed Admin:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
