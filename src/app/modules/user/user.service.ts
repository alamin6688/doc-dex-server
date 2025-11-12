import { Request } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../shared/prisma";
import { fileUploader } from "../../helper/fileUploader";
import { env } from "process";

const createPatient = async (req: Request) => {
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    req.body.patient.profilePhoto = uploadResult?.secure_url;
  }

  const hassedPassword = await bcrypt.hash(
    req.body.password,
    Number(env.BCRYPT_SALT_ROUNDS)
  );
  const result = await prisma.$transaction(async (tnx) => {
    await tnx.user.create({
      data: {
        email: req.body.patient.email,
        password: hassedPassword,
      },
    });
    return await tnx.patient.create({
      data: req.body.patient,
    });
  });
  return result;
};

const getAllFromDB = async ({
  page,
  limit,
}: {
  page: number;
  limit: number;
}) => {
  const skip = (page - 1) * limit;
  const result = await prisma.user.findMany({
    skip,
    take: limit,
  });
  return result;
};

export const UserService = {
  createPatient,
  getAllFromDB,
};
