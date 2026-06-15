"use client";

import { useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { token } from "@/utils/token";
import { env } from "@/utils/env";

let socket: Socket | null = null;

function getSocket(role?: string): Socket {
  if (socket?.connected) return socket;
  const accessToken = token.getAccess(role);
  const baseUrl = env.NEXT_PUBLIC_API_URL.replace("/api/v1", "");
  socket = io(baseUrl, { auth: { token: accessToken }, transports: ["websocket", "polling"] });
  return socket;
}

export function useSocket(role?: string) {
  const socket = getSocket(role);

  const emit = useCallback((event: string, data?: unknown) => {
    socket.emit(event, data);
  }, [socket]);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket]);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    socket.off(event, handler);
  }, [socket]);

  return { socket, emit, on, off };
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
