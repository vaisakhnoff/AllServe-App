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
  POST_REQUEST: "/post-request",
  MY_REQUESTS: "/my-requests",
  REQUEST_DETAILS: (id: string) => `/my-requests/${id}`,
  PROVIDER_REQUESTS: "/provider-portal/requests",
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

  // Service Requests (Marketplace)
  SERVICE_REQUESTS: "/service-requests",
  SERVICE_REQUESTS_MY: "/service-requests/my",
  SERVICE_REQUESTS_STATS: "/service-requests/stats",
  SERVICE_REQUEST_BY_ID: (id: string) => `/service-requests/${id}`,
  SERVICE_REQUEST_CANCEL: (id: string) => `/service-requests/${id}/cancel`,
  SERVICE_REQUESTS_BROWSE: "/service-requests/provider/browse",

  // Provider Quotes (Marketplace)
  PROVIDER_QUOTES: "/provider-quotes",
  PROVIDER_QUOTES_MY: "/provider-quotes/my",
  PROVIDER_QUOTES_STATS: "/provider-quotes/stats",
  PROVIDER_QUOTES_FOR_REQUEST: (requestId: string) => `/provider-quotes/request/${requestId}`,
  PROVIDER_QUOTE_UPDATE: (id: string) => `/provider-quotes/${id}`,
  PROVIDER_QUOTE_WITHDRAW: (id: string) => `/provider-quotes/${id}/withdraw`,
  PROVIDER_QUOTE_ACCEPT: (id: string) => `/provider-quotes/${id}/accept`,
} as const;
