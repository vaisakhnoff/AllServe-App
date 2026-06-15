"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { validateLoginForm } from "@/utils/validation";
import { getErrorMessage } from "@/utils/errorHandler";
import { logger } from "@/utils/logger";
import { ROUTES } from "@/shared/routes";
import { LoginDto } from "@/types/auth.types";
import { Globe, Eye, EyeOff } from "lucide-react";
import { UI_MESSAGES } from "@/shared/messages";

type LoginField = keyof LoginDto;
type LoginFieldErrors = Partial<Record<LoginField, string>>;
type LoginTouchedFields = Partial<Record<LoginField, boolean>>;
type OAuthErrorCode = "auth_failed" | "wrong_platform";

const getOAuthErrorMessage = (code: string | null) => {
  const messages: Partial<Record<OAuthErrorCode, string>> = {
    auth_failed: UI_MESSAGES.OAUTH_AUTH_FAILED,
    wrong_platform: UI_MESSAGES.CROSS_PLATFORM_LOGIN_BLOCKED,
  };

  return code && code in messages ? messages[code as OAuthErrorCode] ?? null : null;
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || undefined;
  const oauthError = getOAuthErrorMessage(searchParams.get("oauthError"));
  const { login } = useAuth();
  const [form, setForm] = useState<LoginDto>({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(oauthError);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [touched, setTouched] = useState<LoginTouchedFields>({});

  const getFieldError = (field: LoginField) => {
    return touched[field] ? fieldErrors[field] : undefined;
  };

  const handleFieldChange = (field: LoginField, value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);

    if (touched[field]) {
      setFieldErrors(validateLoginForm(nextForm));
    }
  };

  const handleFieldBlur = (field: LoginField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors(validateLoginForm(form));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateLoginForm(form);
    setTouched({ email: true, password: true });
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setError(null);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setError(null);
    try {
      await login(form, redirectUrl);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.includes("not verified")) {
        localStorage.setItem("pending_email", form.email);
        logger.warn("Email not verified, redirecting to OTP");
        router.push(ROUTES.VERIFY_OTP);
        return;
      }
      setError(msg);
      logger.error("Login failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  useEffect(() => {
    if (searchParams.get("oauthError")) {
      router.replace(ROUTES.LOGIN);
    }
  }, [router, searchParams]);

  const emailError = getFieldError("email");
  const passwordError = getFieldError("password");

  return (
    <div className="fade-up">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.625rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", marginBottom: "0.375rem" }}>
          Welcome back 👋
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#64748b" }}>
          Sign in to your AllServe account
        </p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "0.875rem", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }} noValidate>
        <div>
          <label className="input-label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            className={`input ${emailError ? "input-error" : ""}`}
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            onBlur={() => handleFieldBlur("email")}
            required
          />
          {emailError && (
            <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
              {emailError}
            </p>
          )}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
            <label className="input-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
            <Link href={ROUTES.FORGOT_PASSWORD} style={{ fontSize: "0.8125rem", color: "#4f46e5", fontWeight: 500, textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPwd ? "text" : "password"}
              className={`input ${passwordError ? "input-error" : ""}`}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => handleFieldChange("password", e.target.value)}
              onBlur={() => handleFieldBlur("password")}
              required
              style={{ paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && (
            <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.25rem" }}>
              {passwordError}
            </p>
          )}
        </div>

        <Button type="submit" size="full" loading={loading} style={{ marginTop: "0.25rem", borderRadius: 10, height: 46 }}>
          Sign in to AllServe
        </Button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        <span style={{ fontSize: "0.8125rem", color: "#94a3b8", fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>

      <button
        onClick={handleGoogleLogin}
        style={{ width: "100%", height: 46, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", fontWeight: 600, fontSize: "0.875rem", color: "#334155", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
        onMouseOver={e => (e.currentTarget.style.borderColor = "#4f46e5")}
        onMouseOut={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
      >
        <Globe size={18} />
        Continue with Google
      </button>

      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#64748b", marginTop: "1.75rem" }}>
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.SIGNUP} style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
          Sign up free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
