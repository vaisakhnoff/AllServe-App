"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { LogOut, Bell } from "lucide-react";
import { Status } from "@/enums/status.enum";

interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title = "Dashboard" }) => {
  const { user, role } = useSelector((state: RootState) => state.auth);
  const { logout } = useAuth();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-2xl border-b border-slate-100/60 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-base font-bold text-slate-900">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Notification */}
        <button className="relative p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-purple-50 hover:border-purple-200 text-slate-500 hover:text-[var(--primary)] transition-all shadow-sm">
          <Bell size={17} />
        </button>

        {/* User chip */}
        <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-full px-3 py-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 border-2 border-white flex items-center justify-center shadow-inner">
            <span className="text-xs font-bold text-[var(--primary)]">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 leading-none">
              {user?.name ?? "User"}
            </span>
            <span className="text-[11px] text-slate-400 leading-none mt-0.5 capitalize font-medium">{role}</span>
          </div>
          {user?.status && (
            <Badge status={user.status as Status} />
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
          <LogOut size={15} />
          Logout
        </Button>
      </div>
    </header>
  );
};
