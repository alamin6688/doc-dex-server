import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import httpStatus from "http-status";
import router from "./app/routes";
import cookieParser from "cookie-parser";
import { PaymentController } from "./app/modules/payment/payment.controller";
import cron from "node-cron";
import { AppointmentService } from "./app/modules/appointment/appointment.service";

const app: Application = express();
app.use(cookieParser());

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhookEvent,
);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://doc-dex-client.vercel.app",
    ],
    credentials: true,
  }),
);

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only schedule cron jobs when not running on Vercel serverless instances.
// Vercel sets `VERCEL=1` in the environment for its runtime; skip cron there.
if (!process.env.VERCEL) {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log(
        "🔄 Running unpaid appointment cleanup at",
        new Date().toISOString(),
      );
      await AppointmentService.cancelUnpaidAppointments();
    } catch (err) {
      console.error("❌ Cron job error:", err);
    }
  });
} else {
  console.log(
    "Cron jobs disabled in serverless environment (VERCEL detected).",
  );
}

app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "Doc Dex server...",
  });
});

app.use("/api/v1", router);

app.use(globalErrorHandler);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
