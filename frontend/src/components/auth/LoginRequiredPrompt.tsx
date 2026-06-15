"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { ROUTES } from "@/shared/routes";

interface LoginRequiredPromptProps {
  title?: string;
  message?: string;
}

export function LoginRequiredPrompt({
  title = "Login required",
  message = "Please login or create an account to continue.",
}: LoginRequiredPromptProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams?.toString();
  const next = `${pathname}${query ? `?${query}` : ""}`;

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <Modal isOpen onClose={() => router.push("/")} title={title} className="max-w-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[var(--primary)]">
            <LockKeyhole size={24} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">{message}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={`${ROUTES.LOGIN}?next=${encodeURIComponent(next)}`}
              className="btn btn-primary px-5 py-2.5 text-sm"
            >
              Login
            </Link>
            <Link
              href={`${ROUTES.SIGNUP}?next=${encodeURIComponent(next)}`}
              className="btn btn-outline px-5 py-2.5 text-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      </Modal>
    </main>
  );
}
