import nodemailer from "nodemailer";
import config from "../../../config";

const emailSender = async (email: string, html: string, subject: string = "Appointment Update") => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.app_pass,
    },
  });

  await transporter.sendMail({
    from: `"DocDex Support" <${config.emailSender.email}>`,
    to: email, 
    subject: subject,
    html,
  });
};

export default emailSender;
