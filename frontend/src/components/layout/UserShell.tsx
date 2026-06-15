"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, CalendarCheck, Home, LogOut, MessageSquare,
  Sparkles, User, Zap, FileText, PlusCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user";
import { ROUTES } from "@/shared/routes";
import { LocationPicker } from "./LocationPicker";

const navItems = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: Home },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "My Requests", href: "/my-requests", icon: FileText },
  { label: "Post Request", href: "/post-request", icon: PlusCircle },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Profile", href: ROUTES.PROFILE, icon: User },
];

export function UserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    userService.getProfile()
      .then((res) => { if (res.data.data.profileImage) setProfileImage(res.data.data.profileImage); })
      .catch(() => {});
  }, []);

  return (
    <div className="marketplace-shell flex min-h-screen text-slate-950">
      {/* Premium Sidebar */}
      <aside className="hidden w-[248px] shrink-0 border-r border-slate-200/60 bg-white px-4 py-5 shadow-[8px_0_32px_rgba(15,23,42,0.03)] lg:flex lg:flex-col">
        {/* Brand */}
        <Link href={ROUTES.DASHBOARD} className="mb-6 flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D28FF] to-[#A855F7] text-white shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Allserve</p>
            <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest">Marketplace</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={active ? "sidebar-link-active" : "sidebar-link"}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <button onClick={logout} className="sidebar-link mt-4 hover:!bg-red-50 hover:!text-red-600 border border-transparent">
          <LogOut size={18} />
          Sign out
        </button>

        {/* Promo card */}
        <div className="mt-4 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50/50 p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm">
            <Sparkles size={16} />
          </div>
          <p className="text-sm font-bold text-slate-900">Find trusted pros</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Browse categories and book verified professionals near you.</p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            {/* Mobile brand */}
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D28FF] to-[#A855F7] text-white">
                <Zap size={18} strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-slate-900">Allserve</span>
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-3 ml-auto">
              <LocationPicker />
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-purple-50 hover:text-[var(--primary)] transition-all">
                <Bell size={17} />
              </button>
              <Link href={ROUTES.PROFILE} className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm hover:bg-slate-50 transition-colors">
                <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-[var(--primary)] font-bold text-sm border-2 border-white">
                  {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileImage} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <User size={15} />
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold leading-none text-slate-900">{user?.name?.split(" ")[0] || "User"}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Customer</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:px-7">
          {children}
        </main>
      </div>
    </div>
  );
}
