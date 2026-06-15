"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarCheck, MessageSquare, Plus, Star, WalletCards } from "lucide-react";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { providerService } from "@/services/provider";
import { ProviderProfile } from "@/types/provider.types";
import toast from "react-hot-toast";

const statIcons = [CalendarCheck, WalletCards, ArrowUpRight, Star];

export default function ProviderDashboardPage() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await providerService.getProfile();
        setProfile(res.data.data);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <ProviderPortalShell>
        <div className="flex h-64 items-center justify-center">
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </ProviderPortalShell>
    );
  }

  const providerStats = [
    { label: "Total Bookings", value: "0", change: "New" },
    { label: "Total Earnings", value: `$${profile?.earnings?.toFixed(2) || "0.00"}`, change: "All time" },
    { label: "Services Listed", value: profile?.services?.length.toString() || "0", change: "Active" },
    { label: "Avg. Rating", value: profile?.rating?.toString() || "0", change: "From 0 reviews" },
  ];

  return (
    <ProviderPortalShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold text-indigo-600">Provider Dashboard</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Welcome back, {profile?.name?.split(" ")[0] || "Provider"}</h1>
          {profile?.businessName && <p className="mt-1 text-sm font-semibold text-slate-600">{profile.businessName}</p>}
          <p className="mt-2 text-slate-500">Track jobs, earnings, service activity, and customer updates.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/provider-portal/services" className="btn btn-primary px-5 py-3"><Plus size={16} /> Add Service</Link>
          <Link href="/provider-portal/bookings" className="btn btn-ghost px-5 py-3">View Requests</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {providerStats.map((stat, index) => {
          const Icon = statIcons[index];
          return (
            <div key={stat.label} className="provider-metric-card">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Icon size={19} />
              </div>
              <p className="text-sm font-bold text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-black">{stat.value}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-600">{stat.change}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="premium-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-black">Latest bookings</h2>
            <Link href="/provider-portal/bookings" className="text-sm font-bold text-indigo-600">View all</Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="p-6 text-center text-sm font-semibold text-slate-500">
              No latest bookings
            </div>
          </div>
        </section>

        <section className="premium-card p-6">
          <div className="mb-5 flex items-center gap-2">
            <MessageSquare size={19} className="text-indigo-600" />
            <h2 className="text-xl font-black">Recent messages</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
              No recent messages
            </div>
          </div>
        </section>
      </div>
    </ProviderPortalShell>
  );
}
