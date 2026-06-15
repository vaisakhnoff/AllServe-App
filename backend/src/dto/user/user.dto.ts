import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
  // Email is restricted from profile update
});

export const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional().default(false),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type UpdateUserDto = z.infer<typeof updateProfileSchema>;
export type AddressDto = z.infer<typeof addressSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
