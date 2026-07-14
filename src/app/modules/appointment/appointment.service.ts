import { randomUUID } from "crypto";
import { prisma } from "../../shared/prisma";
import { IAuthUser } from "../../types/common";
import { getStripe } from "../../helper/stripe";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import {
  AppointmentStatus,
  PaymentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createAppointment = async (user: IAuthUser, payload: any) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const doctorSchedule = await prisma.doctorSchedules.findFirstOrThrow({
    where: {
      doctorId: doctorData.id,
      scheduleId: payload.scheduleId,
      isBooked: false,
    },
    include: {
      schedule: true,
    },
  });

  if (new Date(doctorSchedule.schedule.startDateTime) < new Date()) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot book a slot that has already passed",
    );
  }

  const videoCallingId = randomUUID();

  const result = await prisma.$transaction(async (tnx) => {
    const appointmentData = await tnx.appointment.create({
      data: {
        patientId: patientData.id,
        doctorId: doctorData.id,
        scheduleId: payload.scheduleId,
        videoCallingId,
      },
    });

    await tnx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: doctorData.id,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    const transactionId = randomUUID();

    const paymentData = await tnx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user?.email || "",
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Appointment with ${doctorData.name}`,
            },
            unit_amount: doctorData.appointmentFee * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: appointmentData.id,
        paymentId: paymentData.id,
      },
      success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard/my-appointments`,
    });

    return { paymentUrl: session.url };
  });

  return result;
};

const getMyAppointment = async (
  user: IAuthUser,
  filters: any,
  options: IOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { ...filterData } = filters;

  const andConditions: Prisma.AppointmentWhereInput[] = [];

  if (user?.role === UserRole.PATIENT) {
    andConditions.push({
      patient: {
        email: user?.email,
      },
    });
  } else if (user?.role === UserRole.DOCTOR) {
    andConditions.push({
      doctor: {
        email: user?.email,
      },
    });
  }

  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.keys(filterData).map((key) => ({
      [key]: {
        equals: (filterData as any)[key],
      },
    }));

    andConditions.push(...filterConditions);
  }

  const whereConditions: Prisma.AppointmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.appointment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include:
      user?.role === UserRole.DOCTOR
        ? {
          patient: true,
          schedule: true,
          prescription: true,
          review: true,
          payment: true,
          doctor: {
            include: {
              doctorSpecialties: {
                include: {
                  specialities: true,
                },
              },
            },
          },
        }
        : {
          doctor: {
            include: {
              doctorSpecialties: {
                include: {
                  specialities: true,
                },
              },
            },
          },
          schedule: true,
          prescription: true,
          review: true,
          payment: true,
          patient: true,
        },
  });

  const total = await prisma.appointment.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      limit,
      page,
    },
    data: result,
  };
};

// task get all data from db (appointment data) - admin

const updateAppointmentStatus = async (
  appointmentId: string,
  status: AppointmentStatus,
  user: IAuthUser,
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
    },
  });

  if (user?.role === UserRole.DOCTOR) {
    if (!(user?.email === appointmentData.doctor.email))
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This is not your appointment",
      );
  }

  return await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status,
    },
  });
};

const getAllFromDB = async (filters: any, options: IOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { patientEmail, doctorEmail, ...filterData } = filters;
  const andConditions = [];

  if (patientEmail) {
    andConditions.push({
      patient: {
        email: patientEmail,
      },
    });
  } else if (doctorEmail) {
    andConditions.push({
      doctor: {
        email: doctorEmail,
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

  // console.dir(andConditions, { depth: Infinity })
  const whereConditions: Prisma.AppointmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.appointment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
          createdAt: "desc",
        },
    include: {
      doctor: {
        include: {
          doctorSpecialties: {
            include: {
              specialities: true,
            },
          },
        },
      },
      patient: true,
      schedule: true,
      prescription: true,
      review: true,
      payment: true,
    },
  });
  const total = await prisma.appointment.count({
    where: whereConditions,
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

const cancelUnpaidAppointments = async () => {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  const unPaidAppointments = await prisma.appointment.findMany({
    where: {
      createdAt: {
        lte: thirtyMinAgo,
      },
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  const appointmentIdsToCancel = unPaidAppointments.map(
    (appointment) => appointment.id,
  );

  await prisma.$transaction(async (tnx) => {
    // Update appointments to CANCELED status instead of deleting
    await tnx.appointment.updateMany({
      where: {
        id: {
          in: appointmentIdsToCancel,
        },
      },
      data: {
        status: AppointmentStatus.CANCELED,
      },
    });

    // Delete associated payments
    await tnx.payment.deleteMany({
      where: {
        appointmentId: {
          in: appointmentIdsToCancel,
        },
      },
    });

    // Free up doctor schedules
    for (const unPaidAppointment of unPaidAppointments) {
      await tnx.doctorSchedules.updateMany({
        where: {
          doctorId: unPaidAppointment.doctorId,
          scheduleId: unPaidAppointment.scheduleId,
        },
        data: {
          isBooked: false,
        },
      });
    }
  });
};

const createAppointmentWithPayLater = async (user: IAuthUser, payload: any) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const doctorSchedule = await prisma.doctorSchedules.findFirstOrThrow({
    where: {
      doctorId: doctorData.id,
      scheduleId: payload.scheduleId,
      isBooked: false,
    },
    include: {
      schedule: true,
    },
  });

  if (new Date(doctorSchedule.schedule.startDateTime) < new Date()) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot book a slot that has already passed",
    );
  }

  const videoCallingId = randomUUID();

  const result = await prisma.$transaction(async (tnx) => {
    const appointmentData = await tnx.appointment.create({
      data: {
        patientId: patientData.id,
        doctorId: doctorData.id,
        scheduleId: payload.scheduleId,
        videoCallingId,
      },
      include: {
        patient: true,
        doctor: true,
        schedule: true,
      },
    });

    await tnx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: doctorData.id,
          scheduleId: payload.scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    const transactionId = randomUUID();

    await tnx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    return appointmentData;
  });

  return result;
};

const initiatePaymentForAppointment = async (
  appointmentId: string,
  user: IAuthUser,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user?.email,
    },
  });

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
      patientId: patientData.id,
    },
    include: {
      payment: true,
      doctor: true,
    },
  });

  if (!appointment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Appointment not found or unauthorized",
    );
  }

  if (appointment.paymentStatus !== PaymentStatus.UNPAID) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment already completed for this appointment",
    );
  }

  if (appointment.status === AppointmentStatus.CANCELED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot pay for cancelled appointment",
    );
  }

  // Create Stripe checkout session
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user?.email || "",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Appointment with ${appointment.doctor.name}`,
          },
          unit_amount: appointment.payment!.amount * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId: appointment.id,
      paymentId: appointment.payment!.id,
    },
    // Navigate Links
    success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard/my-appointments`,
  });

  return { paymentUrl: session.url };
};

const confirmPayment = async (sessionId: string) => {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === "paid") {
    const appointmentId = session.metadata?.appointmentId;
    const paymentId = session.metadata?.paymentId;

    if (!appointmentId || !paymentId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing metadata in session");
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { schedule: true, patient: true, doctor: true },
    });

    if (!appointment) {
      throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found");
    }

    if (appointment.paymentStatus === PaymentStatus.UNPAID) {
      const { generateGoogleMeetLink } = require("../../../helper/googleMeet");
      let meetLink: string | null = null;
      if (appointment.schedule) {
        meetLink = await generateGoogleMeetLink(
          `Consultation: ${appointment.patient.name} & Dr. ${appointment.doctor.name}`,
          `Online Consultation Appointment`,
          appointment.schedule.startDateTime,
          appointment.schedule.endDateTime
        );
      }

      const videoCallingId = meetLink || `https://meet.jit.si/docdex-appointment-${appointmentId}`;

      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            videoCallingId,
          },
        });

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.PAID,
            paymentGatewayData: session as any,
          },
        });
      });

      if (videoCallingId) {
        const sendEmails = async () => {
          try {
            const emailSender = require("../auth/emailSender").default;
            const patientHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #4CAF50; text-align: center;">Appointment Confirmed! 🎉</h2>
                <p>Hello <strong>${appointment.patient.name}</strong>,</p>
                <p>Your payment was successful and your appointment has been confirmed.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Doctor:</strong> Dr. ${appointment.doctor.name}</p>
                    <p><strong>Date & Time:</strong> ${new Date(appointment.schedule!.startDateTime).toLocaleString()}</p>
                    <p style="margin-top: 15px;"><strong>Video Consultation Link:</strong></p>
                    <a href="${videoCallingId}" style="display: inline-block; padding: 10px 15px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Video Consultation</a>
                </div>
                <p>Best regards,<br>PH Health Care Team</p>
            </div>`;
            
            const doctorHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #4CAF50; text-align: center;">New Appointment Confirmed! 📅</h2>
                <p>Hello <strong>Dr. ${appointment.doctor.name}</strong>,</p>
                <p>A patient has successfully booked and paid for an appointment with you.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Patient:</strong> ${appointment.patient.name}</p>
                    <p><strong>Date & Time:</strong> ${new Date(appointment.schedule!.startDateTime).toLocaleString()}</p>
                    <p style="margin-top: 15px;"><strong>Video Consultation Link:</strong></p>
                    <a href="${videoCallingId}" style="display: inline-block; padding: 10px 15px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Video Consultation</a>
                </div>
                <p>Best regards,<br>PH Health Care Team</p>
            </div>`;

            await emailSender(appointment.patient.email, patientHtml, "Your Appointment is Confirmed!");
            await emailSender(appointment.doctor.email, doctorHtml, "New Appointment Scheduled");
          } catch (err) {
            console.error("Email sending failed:", err);
          }
        };
        sendEmails().catch(console.error);
      }
    }

    return { success: true, message: "Payment confirmed successfully" };
  }

  return { success: false, message: "Payment not completed yet" };
};

export const AppointmentService = {
  createAppointment,
  getMyAppointment,
  updateAppointmentStatus,
  getAllFromDB,
  cancelUnpaidAppointments,
  createAppointmentWithPayLater,
  initiatePaymentForAppointment,
  confirmPayment,
};
