"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Briefcase,
  CalendarCheck,
  Clock,
  CreditCard,
  Home,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  UserRound,
  Wrench,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Dashboard", href: "/provider-portal/dashboard", icon: Home },
  { label: "Availability", href: "/provider-portal/availability", icon: Clock },
  { label: "Bookings", href: "/provider-portal/bookings", icon: CalendarCheck },
  { label: "Quotations", href: "/provider-portal/quotations", icon: FileText },
  { label: "Invoices", href: "/provider-portal/invoices", icon: CreditCard },
  { label: "Messages", href: "/provider-portal/messages", icon: MessageSquare },
  { label: "Services", href: "/provider-portal/services", icon: Wrench },
  { label: "Earnings", href: "/provider-portal/earnings", icon: CreditCard },
  { label: "Settings", href: "/provider-portal/settings", icon: Settings },
];

import { providerService } from "@/services/provider";
import { ProviderProfile } from "@/types/provider.types";

export function ProviderPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || role !== "provider") {
        router.replace("/provider-portal/login");
      } else {
        providerService.getProfile()
          .then((res) => setProfile(res.data.data))
          .catch(() => {});
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  if (!isInitialized || !isAuthenticated || role !== "provider") {
    return <div className="flex items-center justify-center min-h-screen font-bold text-slate-500">Authenticating session...</div>;
  }

  return (
    <div className="provider-shell flex min-h-screen text-slate-950">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white/90 px-5 py-6 shadow-[12px_0_40px_rgba(15,23,42,0.04)] lg:flex lg:flex-col">
        <Link href="/provider-portal" className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">AllServe</p>
            <p className="text-xs font-semibold text-slate-500">Provider Portal</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={active ? "provider-sidebar-link-active" : "provider-sidebar-link"}>
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          
          <button
            onClick={logout}
            className="provider-sidebar-link mt-auto hover:!bg-red-50 hover:!text-red-600 hover:!border-red-100 border border-transparent"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </nav>

        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-indigo-600">
            <Sparkles size={18} />
          </div>
          <p className="text-sm font-bold text-slate-950">Verified professionals earn more</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Keep services updated to improve job matching.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="hidden min-w-0 flex-1 items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 lg:flex">
              <Search size={17} className="text-slate-400" />
              <input
                className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Search bookings, customers, services"
              />
            </div>

            <Link href="/provider-portal" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <Briefcase size={18} />
              </div>
              <span className="font-black">AllServe Pro</span>
            </Link>

            <div className="flex items-center gap-3">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-600">
                <Bell size={18} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
              </button>
              <button 
                onClick={logout}
                title="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 hover:border-red-100"
              >
                <LogOut size={18} />
              </button>
              <Link href="/provider-portal/profile" className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm hover:bg-slate-50 transition-colors">
                <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-slate-900 to-indigo-700 flex items-center justify-center text-white">
                  {profile?.headshot ? (
                    <img src={profile.headshot} className="h-full w-full object-cover" alt="Profile" />
                  ) : (
                    <UserRound size={16} />
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold leading-none">{profile?.name?.split(" ")[0] || "Provider"}</p>
                  <p className="mt-1 text-xs text-slate-500">{typeof profile?.categoryId === "object" ? profile?.categoryId?.name : "Verified provider"}</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
