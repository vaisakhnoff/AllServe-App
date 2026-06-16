export const Messages = {
  SUCCESS: "Success",
  API_RUNNING: "API running",

  USER_CREATED: "User created successfully",
  USER_NOT_FOUND: "User not found",
  USER_BLOCKED: "User blocked successfully",
  USER_UNBLOCKED: "User unblocked successfully",
  ACCOUNT_BLOCKED: "Your account has been blocked. Please contact support.",
  PROFILE_FETCHED: "Profile fetched successfully",
  PROFILE_UPDATED: "Profile updated successfully",

  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logged out successfully",
  INVALID_CREDENTIALS: "Invalid credentials",
  UNAUTHORIZED: "Unauthorized",
  INVALID_TOKEN: "Invalid token",
  TOKEN_REFRESHED: "Token refreshed",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  FORBIDDEN: "Forbidden",

  VALIDATION_ERROR: "Validation failed",
  SOMETHING_WENT_WRONG: "Something went wrong",

  OTP_SENT: "OTP sent successfully",
  OTP_SENT_EMAIL: "OTP sent to email",
  OTP_SENT_PHONE: "OTP sent to phone successfully",
  OTP_RESENT: "OTP resent successfully",
  OTP_INVALID_OR_EXPIRED: "Invalid or expired OTP",
  EMAIL_OTP_INVALID_OR_EXPIRED: "Invalid or expired Email OTP",
  PHONE_OTP_INVALID_OR_EXPIRED: "Invalid or expired Phone OTP",
  VERIFIED_SUCCESSFULLY: "Verified successfully",

  PASSWORD_UPDATED: "Password updated successfully",
  PASSWORD_RESET_SUCCESS: "Password reset successful",
  INCORRECT_OLD_PASSWORD: "Incorrect old password",

  ADDRESS_NOT_FOUND: "Address not found",
  ADDRESS_ADDED: "Address added successfully",
  ADDRESS_UPDATED: "Address updated successfully",
  ADDRESS_DELETED: "Address deleted successfully",
  DEFAULT_ADDRESS_UPDATED: "Default address updated",
  CANNOT_DELETE_DEFAULT_ADDRESS: "Cannot delete default address without setting another one first",

  APPLICATION_NOT_APPROVED: "Application not approved yet",
  APPLICATION_NOT_FOUND: "Application not found",
  APPLICATION_SUBMITTED: "Application submitted successfully",
  APPLICATION_RESUBMITTED: "Application resubmitted successfully",
  APPLICATION_STATUS_FETCHED: "Application status fetched",
  APPLICATION_STATUS_FETCHED_SUCCESS: "Application status fetched successfully",
  NO_APPLICATION_FOR_EMAIL: "No application found with this email",
  NO_REJECTED_APPLICATION: "No rejected application found",
  REJECTION_REASON_REQUIRED: "A rejection reason is required to reject an application",

  PROVIDER_NOT_FOUND: "Provider not found",
  PROVIDER_PROFILE_NOT_FOUND: "Provider profile not found",
  PROVIDER_PROFILE_ALREADY_APPROVED: "Provider profile already approved",
  PROVIDER_PROFILE_FETCHED: "Provider profile fetched",
  PROVIDER_PROFILE_UPDATED: "Provider profile updated",
  PROVIDER_DASHBOARD_FETCHED: "Provider dashboard fetched",
  PROVIDERS_FETCHED: "Providers fetched successfully",
  PROVIDER_FETCHED: "Provider fetched successfully",
  PROVIDER_APPROVED: "Provider approved successfully",
  PROVIDER_REJECTED: "Provider rejected successfully",
  PROVIDER_BLOCKED: "Provider blocked successfully",
  PROVIDER_UNBLOCKED: "Provider unblocked successfully",

  CATEGORY_CREATED: "Category created successfully",
  CATEGORIES_FETCHED: "Categories fetched successfully",
  CATEGORY_UPDATED: "Category updated successfully",
  CATEGORY_DELETED: "Category deleted successfully",
  CATEGORY_NOT_FOUND: "Category not found",

  SERVICE_CREATED: "Service created successfully",
  SERVICES_FETCHED: "Services fetched successfully",
  SERVICE_FETCHED: "Service fetched successfully",
  SERVICE_UPDATED: "Service updated successfully",
  SERVICE_DELETED: "Service deleted successfully",
  SERVICE_NOT_FOUND: "Service not found",
  SERVICE_ACTIVATED: "Service activated successfully",
  SERVICE_DEACTIVATED: "Service deactivated successfully",
  SERVICE_BLOCKED: "Service blocked successfully",
  SERVICE_UNBLOCKED: "Service unblocked successfully",
  SERVICE_BLOCKED_BY_ADMIN: "This service has been blocked by an administrator and cannot be modified",

  EMAIL_REQUIRED: "Email is required",
  EMAIL_AND_OTP_REQUIRED: "Email and OTP are required",
  EMAIL_ALREADY_IN_USE: "Email is already in use by another account",
  USER_ALREADY_EXISTS: "User already exists",
  ACCOUNT_PENDING_APPROVAL: "Account pending approval",
  EMAIL_NOT_VERIFIED: "Email not verified",
  CANNOT_BLOCK_ADMIN: "Cannot block an admin",
  CANNOT_MODIFY_ADMIN: "Cannot modify admin status",
  PROVIDER_USER_NOT_FOUND: "Provider user account not found",

  AUTH_FAILED: "auth_failed",
  WRONG_PLATFORM: "wrong_platform",


  // ── Provider Auth (independent platform) ──
  PROVIDER_ACCOUNT_EXISTS: "A provider account with this email already exists",
  PROVIDER_ACCOUNT_NOT_FOUND: "Provider account not found",
  PROVIDER_LOGIN_SUCCESS: "Provider login successful",
  PROVIDER_SIGNUP_SUCCESS: "Provider account created. Please verify your email.",
  CROSS_PLATFORM_LOGIN_BLOCKED: "Invalid credentials. Please use the correct platform to log in.",
  PENDING_APPLICATION_EXISTS: "You already have a pending application",
  APPLICATION_ALREADY_SUBMITTED: "Application already submitted",

  // ── Home ──
  HOME_DATA_FETCHED: "Home data fetched successfully",

  // ── Messaging ──
  CONVERSATION_READY: "Conversation ready",
  CONVERSATIONS_FETCHED: "Conversations fetched",
  MESSAGES_FETCHED: "Messages fetched",
  MESSAGE_SENT: "Message sent",
  MESSAGE_MARKED_READ: "Marked as read",
  UNREAD_COUNT_FETCHED: "Unread count",

  // ── Slots ──
  SLOT_CREATED: "Slot created successfully",
  BULK_SLOTS_CREATED: "Bulk slots created",
  RECURRING_SLOTS_CREATED: "Recurring slots created",
  DATE_RANGE_BLOCKED: "Date range blocked",
  STATS_FETCHED: "Stats fetched",
  SLOTS_FETCHED: "Slots fetched successfully",
  SLOT_UPDATED: "Slot updated successfully",
  SLOT_DELETED: "Slot deleted successfully",
  AVAILABLE_SLOTS_FETCHED: "Available slots fetched successfully",
  SLOT_LOCKED: "Slot locked successfully",
  SLOT_UNLOCKED: "Slot unlocked successfully",
  SLOT_BOOKED: "Slot booked successfully",

  // ── Admin ──
  DASHBOARD_STATS_FETCHED: "Dashboard stats fetched successfully",
  APPLICATIONS_FETCHED: "Applications fetched successfully",
  USERS_FETCHED: "Users fetched successfully",

  // ── Bookings ──
  BOOKING_CREATED: "Booking created successfully",
  BOOKINGS_FETCHED: "Bookings fetched",
  BOOKING_FETCHED: "Booking fetched",
  BOOKING_RESCHEDULED: "Booking rescheduled",
  BOOKING_STATUS_UPDATED: "Booking status updated",
  BOOKING_CANCELLED: "Booking cancelled",

  // ── User Additions ──
  PHONE_VERIFIED_UPDATED: "Phone verified and updated successfully",
  EMAIL_VERIFIED_UPDATED: "Email verified and updated successfully",
  NO_IMAGE_PROVIDED: "No image file provided",

  // ── Provider Quotes & Service Requests ──
  QUOTE_SUBMITTED: "Quote submitted",
  QUOTE_UPDATED: "Quote updated",
  QUOTE_ACCEPTED: "Quote accepted, booking created",
  SERVICE_REQUEST_CREATED: "Service request created",
  REQUEST_CANCELLED: "Request cancelled",
  LOCATION_SUGGESTIONS: "Location suggestions",
} as const;
