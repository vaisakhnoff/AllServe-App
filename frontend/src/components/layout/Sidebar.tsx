"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User, MessageSquare, Zap, LogOut, LayoutDashboard,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ROUTES } from "@/shared/routes";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: <LayoutDashboard size={18} /> },
  { label: "Messages", href: "/messages", icon: <MessageSquare size={18} /> },
  { label: "Profile", href: ROUTES.PROFILE, icon: <User size={18} /> },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.role);
  const { logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-[240px] min-h-screen bg-white border-r border-slate-200 sticky top-0 h-screen">
      {/* Brand */}
      <Link href={ROUTES.DASHBOARD} className="block px-5 py-4 border-b border-slate-100 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Zap size={16} color="white" />
          </div>
          <div>
            <div className="font-extrabold text-[0.95rem] text-slate-900 leading-tight">Allserve</div>
            <div className="text-[0.6rem] font-bold text-indigo-600 uppercase tracking-wider">Marketplace</div>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className={isActive ? "text-indigo-600" : "text-slate-400"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border-2 border-indigo-200 flex items-center justify-center font-bold text-sm text-indigo-600 shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name ?? "User"}</p>
            <p className="text-xs text-slate-400 capitalize truncate">{role ?? "user"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
};
