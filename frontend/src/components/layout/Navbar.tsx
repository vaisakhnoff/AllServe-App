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
    <header className="h-16 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Notification placeholder */}
        <button className="relative p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <Bell size={18} />
        </button>

        {/* User chip */}
        <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-600/50 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-400">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white leading-none">
              {user?.name ?? "User"}
            </span>
            <span className="text-xs text-gray-400 leading-none mt-0.5 capitalize">{role}</span>
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
