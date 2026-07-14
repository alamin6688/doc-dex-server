import { Prisma, Schedule } from "@prisma/client";

import { IFilterRequest, ISchedule } from "./schedule.interface";
import { IAuthUser } from "../../types/common";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { prisma } from "../../shared/prisma";

const inserIntoDB = async (payload: ISchedule): Promise<Schedule[]> => {
  const { startDate, endDate, startTime, endTime, timezoneOffset } = payload;
  const intervalTime = 30;
  const schedules = [];
  const currentDate = new Date(startDate);
  const lastDate = new Date(endDate);
  while (currentDate <= lastDate) {
    // Parse HH:mm
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    // Get date parts to construct a timezone-independent date string
    const year = currentDate.getUTCFullYear();
    const month = (currentDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getUTCDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Construct local Date objects as if they were in UTC
    let startDateTime = new Date(`${dateStr}T${startTime.padStart(5, '0')}:00.000Z`);
    let endDateTime = new Date(`${dateStr}T${endTime.padStart(5, '0')}:00.000Z`);

    // If timezoneOffset is provided, adjust to the correct UTC timestamp
    if (timezoneOffset !== undefined) {
      const offsetMinutes = Number(timezoneOffset);
      startDateTime = new Date(startDateTime.getTime() + offsetMinutes * 60000);
      endDateTime = new Date(endDateTime.getTime() + offsetMinutes * 60000);
    } else {
      // Fallback: If no offset is provided (e.g. from tests/seeding), use the server's local timezone calculation
      const serverStart = new Date(currentDate);
      serverStart.setHours(startH, startM, 0, 0);
      const serverEnd = new Date(currentDate);
      serverEnd.setHours(endH, endM, 0, 0);
      
      startDateTime = serverStart;
      endDateTime = serverEnd;
    }

    let currentSlot = new Date(startDateTime);

    while (currentSlot < endDateTime) {
      const slotStart = new Date(currentSlot);
      const slotEnd = new Date(currentSlot.getTime() + intervalTime * 60000); // 30 mins in ms
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          startDateTime: slotStart,
          endDateTime: slotEnd
        }
      });
      if (!existingSchedule) {
        const result = await prisma.schedule.create({
          data: {
            startDateTime: slotStart,
            endDateTime: slotEnd
          }
        });
        schedules.push(result);
      }

      // Increment by 30 mins
      currentSlot = slotEnd;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return schedules;
};

const getAllFromDB = async (
  filters: IFilterRequest,
  options: IOptions,
  user: IAuthUser,
) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { startDate, endDate, ...filterData } = filters;

  const andConditions = [];

  if (startDate && endDate) {
    // Both dates provided - find schedules within the date range
    const startOfDay = new Date(startDate as string);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(endDate as string);
    endOfDay.setUTCHours(23, 59, 59, 999);

    andConditions.push({
      startDateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    });
  } else if (startDate) {
    // Only start date - find schedules on that specific day
    const startOfDay = new Date(startDate as string);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(startDate as string);
    endOfDay.setUTCHours(23, 59, 59, 999);

    andConditions.push({
      startDateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    });
  } else if (endDate) {
    // Only end date - find schedules on that specific day
    const startOfDay = new Date(endDate as string);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(endDate as string);
    endOfDay.setUTCHours(23, 59, 59, 999);

    andConditions.push({
      startDateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    });
  } else {
    // Default: only show future system schedules
    andConditions.push({
      endDateTime: {
        gte: new Date(),
      },
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => {
        return {
          [key]: {
            equals: (filterData as any)[key],
          },
        };
      }),
    });
  }

  const whereConditions: Prisma.ScheduleWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const doctorSchedules = await prisma.doctorSchedules.findMany({
    where: {
      doctor: {
        email: user?.email,
      },
    },
  });

  const doctorScheduleIds = doctorSchedules.map(
    (schedule) => schedule.scheduleId,
  );

  const result = await prisma.schedule.findMany({
    where: {
      ...whereConditions,
      id: {
        notIn: doctorScheduleIds,
      },
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
          createdAt: "desc",
        },
  });

  const total = await prisma.schedule.count({
    where: {
      ...whereConditions,
      id: {
        notIn: doctorScheduleIds,
      },
    },
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const getByIdFromDB = async (id: string): Promise<Schedule | null> => {
  const result = await prisma.schedule.findUnique({
    where: {
      id,
    },
  });

  return result;
};

const deleteFromDB = async (id: string): Promise<Schedule> => {
  const result = await prisma.schedule.delete({
    where: {
      id,
    },
  });
  return result;
};

const cleanUpPassedSchedules = async (): Promise<void> => {
  const now = new Date();

  // 1. Delete all DoctorSchedules in the past that are NOT booked
  const deletedDoctorSchedules = await prisma.doctorSchedules.deleteMany({
    where: {
      isBooked: false,
      schedule: {
        endDateTime: {
          lt: now,
        },
      },
    },
  });

  // 2. Delete all Schedule records in the past that have NO doctorSchedules and NO appointments
  const deletedSchedules = await prisma.schedule.deleteMany({
    where: {
      endDateTime: {
        lt: now,
      },
      doctorSchedules: {
        none: {},
      },
      appointment: {
        none: {},
      },
    },
  });

  if (deletedDoctorSchedules.count > 0 || deletedSchedules.count > 0) {
    console.log(
      `🧹 Cleaned up passed slots: deleted ${deletedDoctorSchedules.count} unbooked doctor schedules and ${deletedSchedules.count} empty schedules.`
    );
  }
};

export const ScheduleService = {
  inserIntoDB,
  getAllFromDB,
  getByIdFromDB,
  deleteFromDB,
  cleanUpPassedSchedules,
};
