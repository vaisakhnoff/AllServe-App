"use client";

import React from "react";
import { Search, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function AdminTopbar() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <header className="admin-topbar">
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search users, providers, bookings..."
            className="admin-input"
            style={{ paddingLeft: "2.5rem", borderRadius: "9999px", backgroundColor: "#f1f5f9", border: "none" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
          <Bell size={20} />
          <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%" }}></span>
        </button>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "1.5rem", borderLeft: "1px solid #e2e8f0" }}>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>{user?.name || "Super Admin"}</span>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{user?.email || "admin@allserve.com"}</span>
          </div>
          <div className="admin-avatar">
            {user?.name?.charAt(0).toUpperCase() || "SA"}
          </div>
          <button 
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", border: "none", background: "none", cursor: "pointer", color: "#64748b", marginLeft: "0.5rem" }}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
