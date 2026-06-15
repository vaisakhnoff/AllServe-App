"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || role !== "admin") {
        router.replace("/admin/login");
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  if (!isInitialized || !isAuthenticated || role !== "admin") {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#64748b" }}>Authenticating session...</div>;
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main-content">
        <AdminTopbar />
        <main className="admin-page-container">
          {children}
        </main>
      </div>
    </div>
  );
}
