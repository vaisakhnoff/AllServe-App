import { ArrowDownToLine, TrendingUp, Wallet } from "lucide-react";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";
import { transactions } from "@/components/provider/providerPortalData";

export default function ProviderEarningsPage() {
  return (
    <ProviderPortalShell>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold text-indigo-600">Earnings</p>
          <h1 className="mt-2 text-3xl font-black">Payout overview</h1>
          <p className="mt-2 text-slate-500">Track total earnings, monthly performance, and transactions.</p>
        </div>
        <button className="btn btn-primary px-5 py-3"><ArrowDownToLine size={16} /> Withdraw money</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="provider-metric-card md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Wallet size={22} /></div>
            <div>
              <p className="text-sm font-bold text-slate-500">Total earnings</p>
              <p className="text-4xl font-black">₹84,250</p>
            </div>
          </div>
          <div className="mt-8 flex h-36 items-end gap-3">
            {[42, 64, 50, 78, 66, 90, 72].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-2xl bg-gradient-to-t from-indigo-600 to-violet-400" style={{ height }} />
                <span className="text-xs font-bold text-slate-400">{["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"][index]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="provider-metric-card">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><TrendingUp size={22} /></div>
          <p className="text-sm font-bold text-slate-500">Monthly breakdown</p>
          <p className="mt-2 text-3xl font-black">₹18,450</p>
          <p className="mt-2 text-sm font-bold text-emerald-600">+18% this month</p>
        </div>
      </div>

      <section className="premium-card mt-8 p-6">
        <h2 className="text-xl font-black">Transaction list</h2>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          {transactions.map((tx) => (
            <div key={tx.id} className="provider-table-row grid gap-3 bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div>
                <p className="font-black">{tx.label}</p>
                <p className="text-sm text-slate-500">{tx.id} · {tx.date}</p>
              </div>
              <span className="text-sm font-black text-slate-700">{tx.status}</span>
              <span className={`text-lg font-black ${tx.amount.startsWith("+") ? "text-emerald-600" : "text-slate-500"}`}>{tx.amount}</span>
            </div>
          ))}
        </div>
      </section>
    </ProviderPortalShell>
  );
}
