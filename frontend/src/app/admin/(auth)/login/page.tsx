"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { getErrorMessage } from "@/utils/errorHandler";
import { UI_MESSAGES } from "@/shared/messages";
import { validateLoginForm } from '@/utils/validation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { adminLogin, isAuthenticated, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [isAuthenticated, role, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateLoginForm({ email, password });
    if (validationErrors.email) {
      setError(validationErrors.email);
      return;
    }
    if (validationErrors.password) {
      setError(validationErrors.password);
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      await adminLogin({ email, password });

    } catch (err: unknown) {
      setError(getErrorMessage(err) || UI_MESSAGES.ADMIN_INVALID_CREDENTIALS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-card">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
          AllServe Admin
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
          Sign in to the high-level control panel
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.875rem", textAlign: "center", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.125rem", position: "relative", zIndex: 10 }} noValidate>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.5rem" }}>
            Admin Email
          </label>
          <div style={{ position: "relative" }}>
            <Mail size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="email"
              className="admin-input"
              style={{ paddingLeft: "2.5rem" }}
              placeholder="admin@allserve.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.5rem" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <Lock size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type={showPassword ? "text" : "password"}
              className="admin-input"
              style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            >
              {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-0.25rem" }}>
          <button
            type="button"
            onClick={() => router.push("/admin/forgot-password")}
            style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}
          >
            Forgot Password?
          </button>
        </div>

        <button type="submit" disabled={loading} className="admin-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.75rem", marginTop: "0.5rem" }}>
          {loading ? "Authenticating..." : "Access Control Panel"}
        </button>
      </form>
    </div>
  );
}
