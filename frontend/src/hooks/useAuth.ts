"use client";

import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/store";
import { setAuth, logout as logoutAction } from "@/features/auth";
import { authService } from "@/services/auth";
import { token } from "@/utils/token";
import { LoginDto, LoginResponse } from "@/types/auth.types";
import { logger } from "@/utils/logger";
import { getErrorMessage } from "@/utils/errorHandler";
import { ROUTES } from "@/shared/routes";
import { getAuthenticatedRoute } from "@/utils/authRedirect";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, role, isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);

  const handleLoginSuccess = (
    dto: LoginDto,
    userData: LoginResponse["user"],
    accessToken: string,
    refreshToken: string,
    redirectUrl?: string
  ) => {
    dispatch(setAuth({ user: userData, accessToken, refreshToken }));
    logger.info("User logged in", { email: dto.email, role: userData.role });

    const target = redirectUrl ?? getAuthenticatedRoute(userData.role);
    if (target.startsWith("/")) {
      router.replace(target);
    } else {
      window.location.replace(target);
    }
  };

  const login = async (dto: LoginDto, redirectUrl?: string): Promise<void> => {
    const res = await authService.login(dto);
    const { user: userData, accessToken, refreshToken } = res.data.data;

    handleLoginSuccess(dto, userData, accessToken, refreshToken, redirectUrl);
  };

  const adminLogin = async (dto: LoginDto): Promise<void> => {
    const res = await authService.adminLogin(dto);
    const { user: userData, accessToken, refreshToken } = res.data.data;

    handleLoginSuccess(dto, userData, accessToken, refreshToken);
  };


  const logout = async (): Promise<void> => {
    const logoutRole = role;
    try {
      const refreshToken = token.getRefresh(logoutRole);
      if (refreshToken) await authService.logout(refreshToken);
    } catch (err) {
      logger.warn("Logout API call failed", getErrorMessage(err));
    } finally {
      dispatch(logoutAction(logoutRole));
      if (logoutRole === "admin") {
        router.push("/admin/login");
      } else if (logoutRole === "provider") {
        router.push("/provider-portal/login");
      } else {
        router.push(ROUTES.LOGIN);
      }
    }
  };

  return { user, role, isAuthenticated, isInitialized, login, adminLogin, logout };
};
