import { Bell, LockKeyhole, Save, UserCog } from "lucide-react";
import { ProviderPortalShell } from "@/components/provider/ProviderPortalShell";

export default function ProviderSettingsPage() {
  return (
    <ProviderPortalShell>
      <div className="mb-8">
        <p className="text-sm font-bold text-indigo-600">Settings</p>
        <h1 className="mt-2 text-3xl font-black">Provider preferences</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="premium-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <UserCog className="text-indigo-600" size={21} />
            <h2 className="text-xl font-black">Edit profile</h2>
          </div>
          <div className="grid gap-4">
            <input className="input" defaultValue="Arjun Nair" />
            <input className="input" defaultValue="arjun.provider@example.com" />
            <input className="input" defaultValue="+91 98765 43210" />
            <button className="btn btn-primary w-fit px-5 py-3"><Save size={16} /> Save changes</button>
          </div>
        </section>

        <section className="premium-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <LockKeyhole className="text-indigo-600" size={21} />
            <h2 className="text-xl font-black">Change password</h2>
          </div>
          <div className="grid gap-4">
            <input className="input" type="password" placeholder="Current password" />
            <input className="input" type="password" placeholder="New password" />
            <input className="input" type="password" placeholder="Confirm new password" />
            <button className="btn btn-ghost w-fit px-5 py-3">Update password</button>
          </div>
        </section>

        <section className="premium-card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <Bell className="text-indigo-600" size={21} />
            <h2 className="text-xl font-black">Notification preferences</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {["New booking requests", "Customer messages", "Earnings and payout updates"].map((label) => (
              <label key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                <span className="text-sm font-bold text-slate-700">{label}</span>
                <input type="checkbox" defaultChecked className="h-5 w-5 accent-indigo-600" />
              </label>
            ))}
          </div>
        </section>
      </div>
    </ProviderPortalShell>
  );
}
