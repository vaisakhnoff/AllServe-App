"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { initializeAuth } from "@/features/auth";
import { token } from "@/utils/token";
import { Loader } from "@/components/common/Loader";
import { ROUTES } from "@/shared/routes";
import { decodeToken } from "@/utils/token";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      // Save tokens securely in local storage
      token.setTokens(accessToken, refreshToken);
      
      // Initialize auth state in Redux
      dispatch(initializeAuth({ pathname: "/google-callback" }));

      // Decode token to find role and redirect accordingly
      const decoded = decodeToken(accessToken);
      if (decoded?.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace(ROUTES.DASHBOARD);
      }
    } else {
      router.replace(`${ROUTES.LOGIN}?oauthError=auth_failed`);
    }
  }, [dispatch, router, searchParams]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <Loader size={40} />
      <p style={{ marginTop: "1rem", color: "#64748b", fontWeight: 500 }}>Authenticating...</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
