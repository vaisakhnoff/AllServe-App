"use client";

import "./globals.css";
import { Provider } from "react-redux";
import { store } from "@/store";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { AuthRouteGuard } from "@/components/auth/AuthRouteGuard";
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>AllServe — Platform</title>
        <meta name="description" content="AllServe — Connect with trusted service providers" />
      </head>
      <body>
        <Provider store={store}>
          <AuthInitializer>
            <AuthRouteGuard>{children}</AuthRouteGuard>
          </AuthInitializer>
        </Provider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
