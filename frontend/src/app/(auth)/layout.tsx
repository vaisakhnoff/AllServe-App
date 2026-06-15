"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { Sparkles } from "lucide-react";
import { RootState } from "@/store";
import { Loader } from "@/components/common/Loader";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isInitialized } = useSelector((state: RootState) => state.auth);
  const isOAuthCallback = pathname === "/google-callback";

  if (!isOAuthCallback && !isInitialized) {
    return <Loader fullScreen />;
  }

  return (
    <div className="auth-shell">
      {/* Left decorative panel */}
      <div className="auth-panel-left">
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "white" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.25)" }}>
              <Sparkles size={22} />
            </div>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>AllServe</span>
          </div>

          <h2 style={{ fontSize: "1.875rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem", letterSpacing: "-0.03em" }}>
            Find the right<br />professional.<br />
            <span style={{ opacity: 0.8 }}>Instantly.</span>
          </h2>
          <p style={{ fontSize: "0.9375rem", opacity: 0.75, maxWidth: 300, margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
            Connect with top-rated service providers in your area for any task, big or small.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 280, margin: "0 auto" }}>
            {["✓ Verified professionals", "✓ Instant booking", "✓ Secure payments", "✓ 5-star guaranteed service"].map(f => (
              <div key={f} style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "0.625rem 1rem", fontSize: "0.875rem", fontWeight: 500, textAlign: "left" }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        {/* Mobile brand */}
        <div style={{ display: "none", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }} className="mobile-brand">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={18} color="white" />
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>AllServe</span>
        </div>
        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
}
