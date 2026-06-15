import { Role } from "@/enums/role.enum";
import { decodeToken, token } from "@/utils/token";

export const getAuthenticatedRoute = (role?: string | null, applicationStatus?: string | null) => {
  if (role === Role.ADMIN) return "/admin/dashboard";
  if (role === Role.PROVIDER) {
    if (applicationStatus === "approved") return "/provider-portal/dashboard";
    return "/provider-portal";
  }
  return "/dashboard";
};

export const getStoredAuthRole = (role?: string | null) => {
  const accessToken = token.getValidAccess(role);
  if (!accessToken) return null;

  const decoded = decodeToken(accessToken);
  return decoded?.role ?? null;
};

export const getStoredAuthenticatedRoute = () => {
  const role = getStoredAuthRole();
  return role ? getAuthenticatedRoute(role) : null;
};
