"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  FileCheck, 
  Tags, 
  CalendarCheck, 
  CreditCard,
  Settings,
  Briefcase
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Providers", href: "/admin/providers", icon: UserSquare2 },
    { name: "Applications", href: "/admin/applications", icon: FileCheck },
    { name: "Categories", href: "/admin/categories", icon: Tags },
    { name: "Services", href: "/admin/services", icon: Briefcase },
    { name: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
  ];

  return (
    <aside className="admin-sidebar">
      <div style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
          A
        </div>
        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em" }}>
          AllServe <span style={{ color: "#4f46e5" }}>Admin</span>
        </span>
      </div>

      <nav style={{ flex: 1, padding: "1.5rem 0", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`admin-nav-link ${isActive ? "active" : ""}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "1.5rem", borderTop: "1px solid #e2e8f0" }}>
        <Link href="/admin/settings" className="admin-nav-link" style={{ margin: 0 }}>
          <Settings size={20} />
          System Settings
        </Link>
      </div>
    </aside>
  );
}
