import Stripe from "stripe";
import { prisma } from "../../shared/prisma";
import { PaymentStatus } from "@prisma/client";
import { generateGoogleMeetLink } from "../../../helper/googleMeet";
import emailSender from "../auth/emailSender";

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  // Check if event has already been processed (idempotency)
  const existingPayment = await prisma.payment.findFirst({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existingPayment) {
    console.log(`⚠️ Event ${event.id} already processed. Skipping.`);
    return { message: "Event already processed" };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;

      const appointmentId = session.metadata?.appointmentId;
      const paymentId = session.metadata?.paymentId;

      if (!appointmentId || !paymentId) {
        console.error("⚠️ Missing metadata in webhook event");
        return { message: "Missing metadata" };
      }

      console.log(`Processing checkout.session.completed for app: ${appointmentId}, pay: ${paymentId}`);
      console.log(`Payment Status: ${session.payment_status}`);

      // Verify appointment exists
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { schedule: true, patient: true, doctor: true },
      });

      if (!appointment) {
        console.error(`⚠️ Appointment ${appointmentId} not found.`);
        return { message: "Appointment not found" };
      }

      let meetLink: string | null = null;

      // 1. Generate Meet Link if paid (Outside transaction)
      if (session.payment_status === "paid" && appointment.schedule) {
        console.log("Generating Google Meet link...");
        meetLink = await generateGoogleMeetLink(
          `Consultation: ${appointment.patient.name} & Dr. ${appointment.doctor.name}`,
          `Online Consultation Appointment`,
          appointment.schedule.startDateTime,
          appointment.schedule.endDateTime
        );
        console.log(`✅ Meet link generated: ${meetLink}`);
      }

      // 2. Update Database in Transaction
      console.log("🔄 Updating database records...");
      await prisma.$transaction(async (tx) => {
        const videoCallingId = meetLink || appointment.videoCallingId;

        await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            paymentStatus:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
            videoCallingId,
          },
        });

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
            paymentGatewayData: session,
            stripeEventId: event.id,
          },
        });
      });
      console.log("✅ Database updated successfully");

      // Verification check (for logic safety)
      const updatedApp = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true, paymentStatus: true, videoCallingId: true }
      });
      console.log(`🔍 Verification - App: ${updatedApp?.id}, Status: ${updatedApp?.paymentStatus}, Link: ${updatedApp?.videoCallingId}`);

      // 3. Send Emails (Outside transaction, async)
      if (meetLink && session.payment_status === "paid") {
        const sendEmails = async () => {
          try {
            console.log("📧 Sending confirmation emails...");
            const patientHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #4CAF50; text-align: center;">Appointment Confirmed! 🎉</h2>
                <p>Hello <strong>${appointment.patient.name}</strong>,</p>
                <p>Your payment was successful and your appointment has been confirmed.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Doctor:</strong> Dr. ${appointment.doctor.name}</p>
                    <p><strong>Date & Time:</strong> ${new Date(appointment.schedule!.startDateTime).toLocaleString()}</p>
                    <p style="margin-top: 15px;"><strong>Google Meet Link:</strong></p>
                    <a href="${meetLink}" style="display: inline-block; padding: 10px 15px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Video Consultation</a>
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
                    <p style="margin-top: 15px;"><strong>Google Meet Link:</strong></p>
                    <a href="${meetLink}" style="display: inline-block; padding: 10px 15px; background-color: #4285F4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Video Consultation</a>
                </div>
                <p>Best regards,<br>PH Health Care Team</p>
            </div>`;

            await emailSender(appointment.patient.email, patientHtml, "Your Appointment is Confirmed!");
            await emailSender(appointment.doctor.email, doctorHtml, "New Appointment Scheduled");
            console.log("✅ Confirmation emails sent");
          } catch (err) {
            console.error("⚠️ Email sending failed:", err);
          }
        };
        
        sendEmails().catch(console.error);
      }

      console.log(`✅ Payment processing finished for app ${appointmentId}`);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as any;
      console.log(`⚠️ Checkout session expired: ${session.id}`);
      // Appointment will be cleaned up by cron job
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as any;
      console.log(`❌ Payment failed: ${paymentIntent.id}`);
      break;
    }

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return { message: "Webhook processed successfully" };
};

export const PaymentService = {
  handleStripeWebhookEvent,
};
