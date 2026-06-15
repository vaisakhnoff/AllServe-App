import { z } from "zod";

const trimmedEmail = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(200, "Email is too long")
  .toLowerCase();

const phoneField = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long");

const passwordField = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password is too long");

const otpField = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, "OTP must be 4–8 digits");

export const providerSignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: trimmedEmail,
  phone: phoneField,
  password: passwordField,
});

export const providerLoginSchema = z.object({
  email: trimmedEmail,
  password: z.string().min(1, "Password is required").max(128),
});

export const providerVerifyOtpSchema = z.object({
  email: trimmedEmail,
  otp: otpField,
});

export const providerResendOtpSchema = z.object({
  email: trimmedEmail,
});

export const providerForgotPasswordSchema = z.object({
  email: trimmedEmail,
});

export const providerResetPasswordSchema = z.object({
  email: trimmedEmail,
  otp: otpField,
  newPassword: passwordField,
});

export const providerRefreshTokenSchema = z.object({
  token: z.string().min(10, "Refresh token is required"),
});

export type ProviderSignupDto = z.infer<typeof providerSignupSchema>;
export type ProviderLoginDto = z.infer<typeof providerLoginSchema>;
export type ProviderVerifyOtpDto = z.infer<typeof providerVerifyOtpSchema>;
export type ProviderResendOtpDto = z.infer<typeof providerResendOtpSchema>;
export type ProviderForgotPasswordDto = z.infer<typeof providerForgotPasswordSchema>;
export type ProviderResetPasswordDto = z.infer<typeof providerResetPasswordSchema>;
export type ProviderRefreshTokenDto = z.infer<typeof providerRefreshTokenSchema>;
