import { Request } from "express";
import { createPatientInput } from "./user.interface";
import bcrypt from "bcryptjs";
import { prisma } from "../../shared/prisma";

const createPatient = async (payload: createPatientInput) => {
  const hassedPassword = await bcrypt.hash(
    payload.password,
    Number(process.env.BCRYPT_SALT_ROUNDS)
  );
  const result = await prisma.$transaction(async (tnx) => {
    await tnx.user.create({
      data: {
        email: payload.email,
        password: hassedPassword,
      },
    });
    return await tnx.patient.create({
      data: {
        name: payload.name,
        email: payload.email,
      },
    });
  });
  return result;
};

export const UserService = {
  createPatient,
};
