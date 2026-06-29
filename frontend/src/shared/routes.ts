export const ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  VERIFY_OTP: "/verify-otp",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  BOOKINGS: "/bookings",
  CATEGORIES: "/categories",
  PROVIDER: "/provider",
  PROVIDER_SIGNUP: "/provider-signup",
  ADMIN: "/admin",
  ADMIN_APPLICATIONS: "/admin/applications",
  ADMIN_CATEGORIES: "/admin/categories",
  PROVIDER_PORTAL_FORGOT_PASSWORD: "/provider-portal/forgot-password",
  PROVIDER_PORTAL_RESET_PASSWORD: "/provider-portal/reset-password",
} as const;

export const API_ENDPOINTS = {
  // Auth
  SIGNUP: "/auth/signup",
  LOGIN: "/auth/login",
  ADMIN_LOGIN: "/auth/admin/login",
  VERIFY_OTP: "/auth/verify-otp",
  RESEND_OTP: "/auth/resend-otp",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  REFRESH_TOKEN: "/auth/refresh-token",
  LOGOUT: "/auth/logout",
  GOOGLE_LOGIN: "/auth/google",

  // ── Provider Auth (independent API) ──
  PROVIDER_SIGNUP: "/provider-auth/signup",
  PROVIDER_LOGIN: "/provider-auth/login",
  PROVIDER_VERIFY_OTP: "/provider-auth/verify-otp",
  PROVIDER_RESEND_OTP: "/provider-auth/resend-otp",
  PROVIDER_FORGOT_PASSWORD: "/provider-auth/forgot-password",
  PROVIDER_RESET_PASSWORD: "/provider-auth/reset-password",
  PROVIDER_REFRESH_TOKEN: "/provider-auth/refresh-token",
  PROVIDER_LOGOUT: "/provider-auth/logout",

  // User
  PROFILE: "/user/profile",

  // Provider
  APPLY_PROVIDER: "/provider/apply",
  PROVIDER_REAPPLY: "/provider/reapply",
  PROVIDER_APPLICATION_STATUS: "/provider/application-status",
  PUBLIC_PROVIDERS: "/providers",
  PROVIDER_PROFILE: "/provider/profile",
  PROVIDER_DASHBOARD: "/provider/dashboard",
  SERVICES: "/services",
  SERVICE_BY_ID: (id: string) => `/services/${id}`,
  SERVICE_ACTIVATE: (id: string) => `/services/${id}/activate`,
  SERVICE_DEACTIVATE: (id: string) => `/services/${id}/deactivate`,
  PUBLIC_SERVICES: "/services/public",
  PUBLIC_SERVICE_BY_ID: (id: string) => `/services/public/${id}`,

  // Admin
  ADMIN_USERS: "/admin/users",
  ADMIN_BLOCK_USER: (id: string) => `/admin/users/${id}/block`,
  ADMIN_UNBLOCK_USER: (id: string) => `/admin/users/${id}/unblock`,
  ADMIN_APPLICATIONS: "/admin/provider-applications",
  ADMIN_APPROVE: (id: string) => `/admin/provider-applications/${id}/approve`,
  ADMIN_REJECT: (id: string) => `/admin/provider-applications/${id}/reject`,
  ADMIN_PROVIDERS: "/admin/providers",
  ADMIN_BLOCK_PROVIDER: (id: string) => `/admin/providers/${id}/block`,
  ADMIN_UNBLOCK_PROVIDER: (id: string) => `/admin/providers/${id}/unblock`,
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_SERVICES: "/admin/services",
  ADMIN_BLOCK_SERVICE: (id: string) => `/admin/services/${id}/block`,
  ADMIN_UNBLOCK_SERVICE: (id: string) => `/admin/services/${id}/unblock`,
  ADMIN_BOOKINGS: "/admin/bookings",

  // Category
  CATEGORIES: "/category",
  CATEGORY_BY_ID: (id: string) => `/category/${id}`,

  // ── Provider Status ──
  PROVIDER_STATUS: "/provider-status",
  PROVIDER_STATUS_TOGGLE: "/provider-status/online",

  // ── Provider Schedule ──
  PROVIDER_SCHEDULE: "/provider-schedule",
  PROVIDER_AVAILABLE_WINDOWS: (id: string) => `/provider-schedule/${id}/available-windows`,

  // ── Provider Leave ──
  PROVIDER_LEAVE: "/provider-leave",
  PROVIDER_LEAVE_CANCEL: (date: string) => `/provider-leave/${date}`,

  // ── Service Orders ──
  ORDERS_DIRECT_INSTANT: "/orders/direct/instant",
  ORDERS_DIRECT_SCHEDULED: "/orders/direct/scheduled",
  ORDERS_INSPECTION: "/orders/inspection",
  ORDERS_CUSTOM: "/orders/custom",
  ORDERS_MY: "/orders/my",
  ORDERS_PROVIDER: "/orders/provider",
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  ORDER_ACCEPT: (id: string) => `/orders/${id}/accept`,
  ORDER_REJECT: (id: string) => `/orders/${id}/reject`,
  ORDER_CUSTOMER_CHOICE: (id: string) => `/orders/${id}/customer-choice`,
  ORDER_CANCEL: (id: string) => `/orders/${id}/cancel`,
  ORDER_START: (id: string) => `/orders/${id}/start`,
  ORDER_COMPLETE: (id: string) => `/orders/${id}/complete`,

  // ── Inspection Lifecycle ──
  ORDER_INSPECTION_ACCEPT: (id: string) => `/orders/${id}/inspection/accept`,
  ORDER_INSPECTION_REJECT: (id: string) => `/orders/${id}/inspection/reject`,
  ORDER_INSPECTION_DONE: (id: string) => `/orders/${id}/inspection/done`,
  ORDER_INSPECTION_START: (id: string) => `/orders/${id}/inspection/start`,
  ORDER_INSPECTION_COMPLETE: (id: string) => `/orders/${id}/inspection/complete`,
  ORDER_DROP_PROVIDER: (id: string) => `/orders/${id}/drop/provider`,
  ORDER_DROP_CUSTOMER: (id: string) => `/orders/${id}/drop/customer`,


  // ── Quotations ──
  QUOTATIONS: "/quotations",
  QUOTATIONS_MY: "/quotations/my",
  QUOTATIONS_FOR_ORDER: (orderId: string) => `/quotations/order/${orderId}`,
  QUOTATION_ACCEPT: (id: string) => `/quotations/${id}/accept`,
  QUOTATION_REJECT: (id: string) => `/quotations/${id}/reject`,
  QUOTATION_MODIFICATION: (id: string) => `/quotations/${id}/request-modification`,
  QUOTATION_REVISE: (id: string) => `/quotations/${id}/revise`,

  // ── Invoices ──
  INVOICES: "/invoices",
  INVOICE_BY_ORDER: (orderId: string) => `/invoices/order/${orderId}`,
  INVOICE_PREFILL: (orderId: string) => `/invoices/prefill/${orderId}`,
  INVOICE_PAY_ONLINE: (id: string) => `/invoices/${id}/pay-online`,
  INVOICE_MARK_CASH: (id: string) => `/invoices/${id}/mark-cash`,
} as const;
