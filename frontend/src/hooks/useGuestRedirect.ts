"use client";

import { useEffect, useState } from "react";
import { getAuthenticatedRoute, getStoredAuthenticatedRoute } from "@/utils/authRedirect";

export const useGuestRedirect = (
  isAuthenticated?: boolean,
  role?: string | null,
  options: { disabled?: boolean } = {},
) => {
  const [redirecting, setRedirecting] = useState(() => !options.disabled && Boolean(getStoredAuthenticatedRoute()));

  useEffect(() => {
    if (options.disabled) {
      setRedirecting(false);
      return;
    }

    const redirectIfAuthenticated = () => {
      const target = getStoredAuthenticatedRoute() ?? (isAuthenticated ? getAuthenticatedRoute(role) : null);
      if (!target) {
        setRedirecting(false);
        return;
      }

      setRedirecting(true);
      window.location.replace(target);
    };

    redirectIfAuthenticated();
    window.addEventListener("pageshow", redirectIfAuthenticated);

    return () => {
      window.removeEventListener("pageshow", redirectIfAuthenticated);
    };
  }, [isAuthenticated, role, options.disabled]);

  return redirecting;
};
