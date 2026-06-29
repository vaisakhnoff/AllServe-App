"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Role } from "@/enums/role.enum";
import { Loader } from "@/components/common/Loader";
import { token } from "@/utils/token";

const USER_PROTECTED_ROUTES = ["/dashboard", "/profile"];
const ADMIN_PUBLIC_ROUTES = ["/admin/login", "/admin/forgot-password"];

const PROVIDER_GUEST_ROUTES = [
  "/provider-portal",
  "/provider-portal/login",
  "/provider-portal/signup",
  "/provider-portal/verify-otp",
  "/provider-portal/forgot-password",
];

// Routes that require provider auth but NOT approval
const PROVIDER_APPLICANT_ROUTES = [
  "/provider-portal/apply",
  "/provider-portal/status",
  "/provider-portal/reapply",
];

// Routes that require provider auth AND approved status
const PROVIDER_APPROVED_ROUTES = [
  "/provider-portal/dashboard",
  "/provider-portal/profile",
  "/provider-portal/services",
  "/provider-portal/slots",
  "/provider-portal/bookings-unified",
  "/provider-portal/earnings",
  "/provider-portal/messages",
  "/provider-portal/settings",
];

const AUTH_PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
];

const getRedirectTarget = (pathname: string, applicationStatus?: string | null) => {
  if (pathname === "/google-callback") return null;

  // ── User protected routes ──
  if (USER_PROTECTED_ROUTES.includes(pathname)) {
    if (!token.hasValidRole(Role.USER)) return "/login";
    return null;
  }

  // ── Admin protected routes ──
  if (pathname.startsWith("/admin") && !ADMIN_PUBLIC_ROUTES.includes(pathname)) {
    if (!token.hasValidRole(Role.ADMIN)) return "/admin/login";
    return null;
  }

  // ── Provider applicant routes (need auth, any status) ──
  if (PROVIDER_APPLICANT_ROUTES.includes(pathname)) {
    if (!token.hasValidRole(Role.PROVIDER)) return "/provider-portal/login";
    // Block /apply if already submitted
    if (pathname === "/provider-portal/apply" && applicationStatus && applicationStatus !== "not_applied") {
      return "/provider-portal";
    }
    // Block /reapply if not rejected
    if (pathname === "/provider-portal/reapply" && applicationStatus !== "rejected") {
      return "/provider-portal";
    }
    return null;
  }

  // ── Provider approved-only routes ──
  if (PROVIDER_APPROVED_ROUTES.includes(pathname)) {
    if (!token.hasValidRole(Role.PROVIDER)) return "/provider-portal/login";
    if (applicationStatus !== "approved") return "/provider-portal";
    return null;
  }

  // ── Guest routes: redirect authenticated users away from login/signup ──
  if (AUTH_PUBLIC_ROUTES.includes(pathname) && token.hasValidRole(Role.USER)) {
    return "/dashboard";
  }
  if (ADMIN_PUBLIC_ROUTES.includes(pathname) && token.hasValidRole(Role.ADMIN)) {
    return "/admin/dashboard";
  }
  // Provider login/signup → redirect to portal/dashboard if already authenticated
  if (PROVIDER_GUEST_ROUTES.includes(pathname) && pathname !== "/provider-portal") {
    if (token.hasValidRole(Role.PROVIDER)) {
      return applicationStatus === "approved" ? "/provider-portal/dashboard" : "/provider-portal";
    }
  }

  return null;
};

export function AuthRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { applicationStatus, isInitialized } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);
  const redirectTarget = mounted && isInitialized ? getRedirectTarget(pathname, applicationStatus) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (redirectTarget && redirectTarget !== pathname) {
      router.replace(redirectTarget);
    }
  }, [pathname, redirectTarget, router]);

  if (!mounted || !isInitialized || (redirectTarget && redirectTarget !== pathname)) {
    return <Loader fullScreen />;
  }

  return <>{children}</>;
}
