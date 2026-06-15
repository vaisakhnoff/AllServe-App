import { UI_MESSAGES } from "@/shared/messages";
import type { SignupDto } from "@/types/auth.types";
import type { AddressDto } from "@/types/user.types";

export const validatePasswordStrength = (password: string) => {
  let score = 0;
  if (!password) return { score, message: "" };

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  let message = "Weak";
  if (score >= 3) message = "Strong";
  else if (score >= 2) message = "Fair";

  return { score, message };
};

export const doPasswordsMatch = (p1: string, p2: string) => {
  return p1 === p2;
};

export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const validateLoginForm = (form: { email: string; password: string }) => {
  const errors: Partial<Record<"email" | "password", string>> = {};

  if (!form.email.trim()) {
    errors.email = UI_MESSAGES.EMAIL_REQUIRED;
  } else if (!isValidEmail(form.email)) {
    errors.email = UI_MESSAGES.EMAIL_INVALID;
  }

  if (!form.password) {
    errors.password = UI_MESSAGES.PASSWORD_REQUIRED;
  }

  return errors;
};

export const validateForgotPasswordEmail = (email: string) => {
  if (!email.trim()) {
    return UI_MESSAGES.EMAIL_REQUIRED;
  }

  if (!isValidEmail(email)) {
    return UI_MESSAGES.EMAIL_INVALID;
  }

  return null;
};

export type SignupField = "name" | "email" | "password" | "confirm";
export type SignupErrors = Partial<Record<SignupField, string>>;

export const PASSWORD_RULES = [
  {
    text: "At least 8 characters",
    test: (password: string) => password.length >= 8,
  },
  {
    text: "One uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    text: "One lowercase letter",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    text: "One number",
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    text: "One special character",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const;

export const validateSignupForm = (
  form: SignupDto,
  confirmPassword: string
): SignupErrors => {
  const errors: SignupErrors = {};
  const passwordStrength = validatePasswordStrength(form.password);

  if (!form.name.trim()) {
    errors.name = UI_MESSAGES.NAME_REQUIRED;
  } else if (form.name.trim().length < 2) {
    errors.name = UI_MESSAGES.NAME_TOO_SHORT;
  }

  if (!form.email.trim()) {
    errors.email = UI_MESSAGES.EMAIL_REQUIRED;
  } else if (!isValidEmail(form.email)) {
    errors.email = UI_MESSAGES.EMAIL_INVALID;
  }

  if (!form.password) {
    errors.password = UI_MESSAGES.PASSWORD_REQUIRED;
  } else if (passwordStrength.score < 2) {
    errors.password = UI_MESSAGES.PASSWORD_TOO_WEAK;
  }

  if (!confirmPassword) {
    errors.confirm = UI_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
  } else if (!doPasswordsMatch(form.password, confirmPassword)) {
    errors.confirm = UI_MESSAGES.PASSWORDS_DO_NOT_MATCH;
  }

  return errors;
};

export type ProfileField = "name" | "phone";
export type ProfileErrors = Partial<Record<ProfileField, string>>;

export const validateProfileForm = (form: { name: string; phone: string }): ProfileErrors => {
  const errors: ProfileErrors = {};

  if (!form.name.trim()) {
    errors.name = UI_MESSAGES.PROFILE_NAME_REQUIRED;
  } else if (form.name.trim().length < 2) {
    errors.name = UI_MESSAGES.PROFILE_NAME_TOO_SHORT;
  }

  if (!form.phone) {
    errors.phone = UI_MESSAGES.PROFILE_PHONE_REQUIRED;
  } else if (form.phone.length !== 10) {
    errors.phone = UI_MESSAGES.PROFILE_PHONE_INVALID;
  }

  return errors;
};

export type ProfilePwdField = "oldPassword" | "newPassword" | "confirmPassword";
export type ProfilePwdErrors = Partial<Record<ProfilePwdField, string>>;

export const validateProfilePasswordForm = (
  form: { oldPassword: string; newPassword: string },
  confirmPassword: string
): ProfilePwdErrors => {
  const errors: ProfilePwdErrors = {};
  const strength = validatePasswordStrength(form.newPassword);

  if (!form.oldPassword.trim()) {
    errors.oldPassword = UI_MESSAGES.PROFILE_CURRENT_PASSWORD_REQUIRED;
  }

  if (!form.newPassword.trim()) {
    errors.newPassword = UI_MESSAGES.PROFILE_NEW_PASSWORD_REQUIRED;
  } else if (strength.score < 2) {
    errors.newPassword = UI_MESSAGES.PROFILE_PASSWORD_TOO_WEAK;
  } else if (form.oldPassword === form.newPassword) {
    errors.newPassword = UI_MESSAGES.PROFILE_PASSWORD_SAME_AS_OLD;
  }

  if (!confirmPassword.trim()) {
    errors.confirmPassword = UI_MESSAGES.PROFILE_CONFIRM_PASSWORD_REQUIRED;
  } else if (!doPasswordsMatch(form.newPassword, confirmPassword)) {
    errors.confirmPassword = UI_MESSAGES.PROFILE_PASSWORDS_DO_NOT_MATCH;
  }

  return errors;
};

export type AddressField = "street" | "city" | "state" | "zip" | "country";
export type AddressErrors = Partial<Record<AddressField, string>>;

export const validateAddressForm = (form: AddressDto): AddressErrors => {
  const errors: AddressErrors = {};

  if (!form.street.trim()) {
    errors.street = UI_MESSAGES.ADDRESS_STREET_REQUIRED;
  }

  if (!form.city.trim()) {
    errors.city = UI_MESSAGES.ADDRESS_CITY_REQUIRED;
  }

  if (!form.state.trim()) {
    errors.state = UI_MESSAGES.ADDRESS_STATE_REQUIRED;
  }

  if (!form.zip.trim()) {
    errors.zip = UI_MESSAGES.ADDRESS_ZIP_REQUIRED;
  } else if (!/^\d{5,6}$/.test(form.zip.trim())) {
    errors.zip = UI_MESSAGES.ADDRESS_ZIP_INVALID;
  }

  if (!form.country.trim()) {
    errors.country = UI_MESSAGES.ADDRESS_COUNTRY_REQUIRED;
  } else if (form.country.trim().length < 2) {
    errors.country = UI_MESSAGES.ADDRESS_COUNTRY_TOO_SHORT;
  }

  return errors;
};

export const normalizeAddressForm = (form: AddressDto): AddressDto & { isDefault: boolean } => {
  return {
    street: form.street.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    zip: form.zip.trim(),
    country: form.country.trim(),
    isDefault: Boolean(form.isDefault),
  };
};

export type ProviderProfileField = "name" | "description" | "experience" | "serviceAreas";
export type ProviderProfileErrors = Partial<Record<ProviderProfileField, string>>;

export const validateProviderProfileForm = (form: {
  name: string;
  description: string;
  experience: string;
  serviceAreas: string;
}): ProviderProfileErrors => {
  const errors: ProviderProfileErrors = {};

  if (!form.name.trim()) {
    errors.name = UI_MESSAGES.PROVIDER_NAME_REQUIRED;
  } else if (form.name.trim().length < 2) {
    errors.name = UI_MESSAGES.PROVIDER_NAME_TOO_SHORT;
  } else if (form.name.trim().length > 50) {
    errors.name = UI_MESSAGES.PROVIDER_NAME_TOO_LONG;
  }

  if (form.description && form.description.trim().length > 0 && form.description.trim().length < 10) {
    errors.description = UI_MESSAGES.PROVIDER_DESCRIPTION_TOO_SHORT;
  } else if (form.description.trim().length > 500) {
    errors.description = UI_MESSAGES.PROVIDER_DESCRIPTION_TOO_LONG;
  }

  if (!form.experience.trim()) {
    errors.experience = UI_MESSAGES.PROVIDER_EXPERIENCE_REQUIRED;
  } else {
    const exp = Number(form.experience);
    if (isNaN(exp) || exp < 0 || exp > 50) {
      errors.experience = UI_MESSAGES.PROVIDER_EXPERIENCE_INVALID;
    }
  }

  const areas = form.serviceAreas.split(",").map(a => a.trim()).filter(Boolean);
  if (areas.length === 0) {
    errors.serviceAreas = UI_MESSAGES.PROVIDER_SERVICE_AREAS_REQUIRED;
  }

  return errors;
};

export const validateOtp = (otp: string): string | null => {
  if (!otp.trim()) return UI_MESSAGES.OTP_REQUIRED;
  if (otp.trim().length < 6) return UI_MESSAGES.OTP_INCOMPLETE;
  return null;
};

export type ProviderSignupField = "name" | "email" | "phone" | "password" | "confirmPassword";
export type ProviderSignupErrors = Partial<Record<ProviderSignupField, string>>;

export const validateProviderSignupForm = (form: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}): ProviderSignupErrors => {
  const errors: ProviderSignupErrors = {};

  if (!form.name.trim()) errors.name = UI_MESSAGES.NAME_REQUIRED;
  else if (form.name.trim().length < 3) errors.name = UI_MESSAGES.NAME_MIN_3;

  if (!form.email.trim()) errors.email = UI_MESSAGES.EMAIL_REQUIRED;
  else if (!isValidEmail(form.email)) errors.email = UI_MESSAGES.EMAIL_INVALID;

  if (!form.phone.trim()) errors.phone = UI_MESSAGES.PHONE_REQUIRED;
  else if (form.phone.replace(/\D/g, "").length < 10) errors.phone = UI_MESSAGES.PHONE_INVALID;

  if (!form.password) errors.password = UI_MESSAGES.PASSWORD_REQUIRED;
  else if (validatePasswordStrength(form.password).score < 2) errors.password = UI_MESSAGES.PASSWORD_TOO_WEAK;

  if (!form.confirmPassword) errors.confirmPassword = UI_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
  else if (!doPasswordsMatch(form.password, form.confirmPassword)) errors.confirmPassword = UI_MESSAGES.PASSWORDS_DO_NOT_MATCH;

  return errors;
};
