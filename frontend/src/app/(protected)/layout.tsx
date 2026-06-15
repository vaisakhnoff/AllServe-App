"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ROUTES } from "@/shared/routes";
import { Loader } from "@/components/common/Loader";
import { UserShell } from "@/components/layout/UserShell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized || !isAuthenticated) {
    return <Loader fullScreen />;
  }

  return <UserShell>{children}</UserShell>;
}
