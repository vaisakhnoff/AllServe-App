import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../logger/logger";

export const sendEmail = async (to: string, otp: string): Promise<void> => {
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    logger.info(`[TESTING] Mock email sent to ${to}: Your OTP is ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"AllServe" <${env.EMAIL_USER}>`,
    to,
    subject: "Your Verification Code",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
        <h2 style="margin:0 0 16px">Verification Code</h2>
        <p style="color:#374151">Your OTP is:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;margin:16px 0">${otp}</p>
        <p style="color:#6b7280;font-size:14px">This code expires in 5 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
};