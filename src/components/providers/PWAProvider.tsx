"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/register";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { NotificationPrompt } from "@/components/pwa/NotificationPrompt";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker().catch(() => {});
  }, []);

  return (
    <>
      {children}
      <InstallBanner />
      <NotificationPrompt />
    </>
  );
}
