import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.service";
import pick from "../../helper/pick";
import {
  userFilterableFields,
  userPaginationAndSortingFields,
} from "./user.constant";
import { IJWTPayload } from "../../types/common";
import httpStatus from "http-status";

const createPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createPatient(req);
  // console.log(result);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Patient created successfully!",
    data: result,
  });
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createAdmin(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Admin Created successfuly!",
    data: result,
  });
});

const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createDoctor(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Doctor Created successfuly!",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, userPaginationAndSortingFields);
  const result = await UserService.getAllFromDB(filters, options);
  // console.log(result);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrive successfully!",
    meta: result.meta,
    data: result.data,
  });
});

const getMyProfile = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;

    const result = await UserService.getMyProfile(user as IJWTPayload);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My profile data fetched!",
      data: result,
    });
  }
);

export const UserController = {
  createPatient,
  createAdmin,
  createDoctor,
  getAllFromDB,
  getMyProfile,
};
