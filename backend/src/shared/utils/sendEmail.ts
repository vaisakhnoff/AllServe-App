import nodemailer from "nodemailer";

export const sendEmail = async (to: string, otp: string) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[TESTING] Mock Email sent to ${to}: Your OTP is ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "OTP Verification",
    text: `Your OTP is ${otp}`,
  });
};