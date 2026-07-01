"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, CalendarCheck, Home, LogOut, MessageSquare,
  Sparkles, User, Zap, Menu, X,
  Heart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user";
import { ROUTES } from "@/shared/routes";
import { LocationPicker } from "./LocationPicker";

const navItems = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: Home },
  { label: "My Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Favourites", href: "/favourites", icon: Heart },
  { label: "Profile", href: ROUTES.PROFILE, icon: User },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export function UserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useSelector((state: RootState) => state.auth);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    userService.getProfile()
      .then((res) => { if (res.data.data.profileImage) setProfileImage(res.data.data.profileImage); })
      .catch(() => {});
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  return (
    <div className="marketplace-shell flex min-h-screen">
      {/* Desktop Sidebar — Floating Glass Panel */}
      <aside className="hidden w-[260px] shrink-0 lg:flex lg:flex-col fixed top-0 left-0 h-screen z-40">
        <div className="m-3 flex flex-1 flex-col rounded-[var(--radius-xl)] bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          {/* Brand */}
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-3 px-5 pt-6 pb-4 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#141414] text-white shadow-lg shadow-black/15 group-hover:scale-105 transition-all duration-300">
              <Zap size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[1.05rem] font-extrabold tracking-tight text-slate-900 uppercase">Allserve</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Marketplace</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-1 px-3 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== ROUTES.DASHBOARD && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`${active ? "sidebar-link-active" : "sidebar-link"} justify-between`}>
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        

          {/* Sign out */}
          <div className="border-t border-slate-100 px-3 py-3">
            <button onClick={logout} className="sidebar-link w-full hover:!bg-red-50 hover:!text-red-600">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
        {/* Top header — detailed navbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-slate-100/60 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            {/* Left: mobile menu + location */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-all lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <LocationPicker />
            </div>

            {/* Right: messages · notifications · profile */}
            <div className="flex items-center gap-2">
              <Link
                href="/messages"
                aria-label="Messages"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:bg-purple-50 hover:text-[var(--primary)] hover:border-purple-200 hover:shadow-md"
              >
                <MessageSquare size={17} />
              </Link>

              <button
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:bg-purple-50 hover:text-[var(--primary)] hover:border-purple-200 hover:shadow-md"
              >
                <Bell size={17} />
              </button>

              <span className="mx-0.5 hidden h-7 w-px bg-slate-200/80 sm:block" />

              {/* Profile Chip */}
              <div className="relative">
                <Link
                  href={ROUTES.PROFILE}
                  className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-200/60"
                >
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center text-[var(--primary)] font-bold text-sm border-2 border-white shadow-inner">
                    {profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileImage} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <User size={15} />
                    )}
                  </div>
                  <div className="hidden text-left sm:block pr-2">
                    <p className="text-sm font-bold leading-none text-slate-900">{user?.name?.split(" ")[0] || "User"}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">Customer</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Menu — Spatial Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-white/95 backdrop-blur-xl shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#6D28FF] to-[#A855F7] text-white shadow-md">
                    <Zap size={18} strokeWidth={2.5} />
                  </div>
                  <span className="font-extrabold text-slate-900">Allserve</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1">
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

              <div className="px-3 pb-5">
                <button onClick={logout} className="sidebar-link w-full hover:!bg-red-50 hover:!text-red-600">
                  <LogOut size={18} />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
