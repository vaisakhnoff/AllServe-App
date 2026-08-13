"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, CalendarCheck, Home, LogOut, MessageSquare,
  User, Menu, X, ChevronDown, Bookmark, MapPin, CreditCard, Star, ArrowRight,
  LogIn, UserPlus, Layers,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user";
import { ROUTES } from "@/shared/routes";
import { LocationPicker } from "./LocationPicker";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string;
  protected?: boolean;
}







export function UserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

         const homeHref = isAuthenticated ? ROUTES.DASHBOARD : "/";

         const navItems: NavItem[] = [
  { label: "Home", href: homeHref, icon: Home },
  { label: "Categories", href: "/categories", icon: Layers },
  { label: "My Bookings", href: "/bookings", icon: CalendarCheck, protected: true },
  { label: "Messages", href: "/messages", icon: MessageSquare, badge: "2", protected: true },
  { label: "Saved Services", href: "/saved-services", icon: Bookmark, protected: true },
];

  useEffect(() => {
    if (isAuthenticated) {
      userService.getProfile()
        .then((res) => {
          const img = res.data.data?.profileImage;
          if (img) setProfileImage(img);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const activeAvatar = profileImage || (user as unknown as { profileImage?: string })?.profileImage || null;
  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const firstInitial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      {isAuthenticated && (
        <aside className="hidden w-[260px] shrink-0 lg:flex lg:flex-col fixed top-0 left-0 h-screen z-40 bg-white border-r border-slate-100/80">
        <div className="flex flex-1 flex-col justify-between py-5 px-4 overflow-y-auto">
          <div>
            {/* Brand Logo */}
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2.5 px-2 pb-6 pt-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B761] text-white shadow-sm shadow-[#00B761]/20">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">AllServe</span>
            </Link>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== ROUTES.DASHBOARD && item.href !== "/" && pathname.startsWith(item.href));
                const targetHref = item.protected && !isAuthenticated ? `${ROUTES.LOGIN}?redirect=${encodeURIComponent(item.href)}` : item.href;
                return (
                  <Link
                    key={item.href}
                    href={targetHref}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-[#E6F7F0] text-[#00B761]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={18} className={active ? "text-[#00B761]" : "text-slate-400"} />
                      {item.label}
                    </span>
                    {item.badge && isAuthenticated && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00B761] text-[11px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Become a Provider Promo Card & Auth Actions */}
          <div className="space-y-4 pt-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#F0FDF4] to-[#E6F7F0] p-4 border border-emerald-100/80 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">Become a<br />Provider</h4>
                  <p className="mt-1 text-[11px] text-slate-500 font-medium max-w-[110px]">
                    Join AllServe and grow your business
                  </p>
                </div>
                <div className="w-12 h-12 relative shrink-0 rounded-xl bg-[#00B761]/10 flex items-center justify-center text-[#00B761]">
                  <User size={24} />
                </div>
              </div>
              <Link
                href="/provider-portal"
                className="mt-3 flex items-center justify-between w-full rounded-xl bg-[#00B761] hover:bg-[#009E52] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm shadow-[#00B761]/20 group"
              >
                <span>Get Started</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {isAuthenticated ? (
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut size={18} className="text-slate-400" />
                Logout
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  href={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#00B761] hover:bg-[#009E52] text-white text-xs font-bold transition-all shadow-sm shadow-[#00B761]/20"
                >
                  <LogIn size={15} /> Log In
                </Link>
                <Link
                  href={ROUTES.SIGNUP || "/register"}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                >
                  <UserPlus size={15} /> Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
      )}
      

      {/* Main content area */}
      <div className={`flex min-w-0 flex-1 flex-col ${isAuthenticated ? "lg:pl-[260px]" : "pl-0"}`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            {/* Left: mobile menu toggle + location picker */}
            {/* Left: Brand logo (for guests) or mobile toggle (for logged-in) + Location Picker */}
<div className="flex items-center gap-3">
  {!isAuthenticated ? (
    <Link href="/" className="flex items-center gap-2 mr-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00B761] text-white shadow-sm">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
      </div>
      <span className="text-lg font-black tracking-tight text-slate-900">AllServe</span>
    </Link>
  ) : (
    <button
      onClick={() => setMobileMenuOpen(true)}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-all lg:hidden"
    >
      <Menu size={18} />
    </button>
  )}

  <LocationPicker />
</div>


            {/* Right: messages · notifications · profile or login/register */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/messages"
                    aria-label="Messages"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                  >
                    <MessageSquare size={17} />
                  </Link>

                  <button
                    aria-label="Notifications"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                  >
                    <Bell size={17} />
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00B761] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      3
                    </span>
                  </button>

                  <span className="mx-0.5 hidden h-6 w-px bg-slate-200/70 sm:block" />

                  {/* Profile Chip */}
                  <Link
                    href={ROUTES.PROFILE}
                    className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white py-1 pl-1 pr-3 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow"
                  >
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-[#E6F7F0] flex items-center justify-center text-xs font-extrabold text-[#00B761]">
                      {activeAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={activeAvatar} className="h-full w-full object-cover" alt={firstName} />
                      ) : (
                        <span>{firstInitial}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{firstName}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`}
                    className="px-4 py-2 rounded-full bg-[#00B761] hover:bg-[#009E52] text-white text-xs font-bold transition-all shadow-sm shadow-[#00B761]/20"
                  >
                    Log In
                  </Link>
                  <Link
                    href={ROUTES.SIGNUP || "/register"}
                    className="hidden sm:inline-flex px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Menu — Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white p-5 shadow-2xl lg:hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00B761] text-white">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                      </svg>
                    </div>
                    <span className="text-xl font-black text-slate-900">AllServe</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    const targetHref = item.protected && !isAuthenticated ? `${ROUTES.LOGIN}?redirect=${encodeURIComponent(item.href)}` : item.href;
                    return (
                      <Link
                        key={item.href}
                        href={targetHref}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                          active ? "bg-[#E6F7F0] text-[#00B761]" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={18} className={active ? "text-[#00B761]" : "text-slate-400"} />
                          {item.label}
                        </span>
                        {item.badge && isAuthenticated && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00B761] text-[11px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100">
                {isAuthenticated ? (
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3.5 py-3 w-full rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(pathname)}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#00B761] text-white text-xs font-bold"
                    >
                      <LogIn size={15} /> Log In
                    </Link>
                    <Link
                      href={ROUTES.SIGNUP || "/register"}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                    >
                      <UserPlus size={15} /> Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
