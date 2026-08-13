"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { initializeAuth, setUser, setApplicationStatus } from "@/features/auth";
import { providerService } from "@/services/provider";
import { userService } from "@/services/user";
import { Role } from "@/enums/role.enum";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { isAuthenticated, role, user, applicationStatus } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth({ pathname }));
  }, [dispatch, pathname]);

  useEffect(() => {
    if (isAuthenticated && !user && role === Role.USER) {
      userService.getProfile().then((res) => {
        const profile = res.data.data;
        dispatch(setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          status: profile.status,
          isVerified: profile.isVerified,
        }));
      }).catch(() => {});
    }
  }, [isAuthenticated, user, role, dispatch]);

  useEffect(() => {
    if (isAuthenticated && role === Role.PROVIDER && !applicationStatus) {
      providerService.getApplicationStatus().then((res) => {
        const status = res.data.data?.status;
        if (status) {
          dispatch(setApplicationStatus(status));
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, applicationStatus, role, dispatch]);

  return <>{children}</>;
}
