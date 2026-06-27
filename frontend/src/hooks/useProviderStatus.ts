"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./useSocket";

interface ProviderStatus {
  onlineStatus: "online" | "offline";
  engagementStatus: "available" | "busy";
}

export function useProviderStatus(
  providerId: string | null,
  initial?: { onlineStatus?: string; engagementStatus?: string },
  role?: string
): ProviderStatus {
  const { emit, on } = useSocket(role);

  const [status, setStatus] = useState<ProviderStatus>({
    onlineStatus: (initial?.onlineStatus as "online" | "offline") ?? "offline",
    engagementStatus: (initial?.engagementStatus as "available" | "busy") ?? "available",
  });

  // Sync when initial props change (after API fetch completes)
  useEffect(() => {
    if (initial?.onlineStatus) {
      setStatus({
        onlineStatus: (initial.onlineStatus as "online" | "offline") ?? "offline",
        engagementStatus: (initial.engagementStatus as "available" | "busy") ?? "available",
      });
    }
  }, [initial?.onlineStatus, initial?.engagementStatus]);

  // Watch provider room and listen for changes
  useEffect(() => {
    if (!providerId) return;

    emit("watch-provider", providerId);

    const cleanup = on("provider:status-changed", (...args: unknown[]) => {
      const data = args[0] as { providerId: string; onlineStatus: string; engagementStatus: string };
      if (data.providerId === providerId) {
        setStatus({
          onlineStatus: data.onlineStatus as "online" | "offline",
          engagementStatus: data.engagementStatus as "available" | "busy",
        });
      }
    });

    return () => {
      cleanup();
      emit("unwatch-provider", providerId);
    };
  }, [providerId, emit, on]);

  return status;
}
