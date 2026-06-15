"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { initializeAuth, setUser } from "@/features/auth";
import { userService } from "@/services/user";
import { Role } from "@/enums/role.enum";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { isAuthenticated, role, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth({ pathname }));
  }, [dispatch, pathname]);

  // Fetch user profile if authenticated but user data is missing (e.g. after page refresh)
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

  return <>{children}</>;
}
