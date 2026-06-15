"use client";

import { useEffect } from "react";
import { onForegroundMessage } from "@/lib/fcm/client";
import toast from "react-hot-toast";

export function FCMProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    onForegroundMessage((payload) => {
      const data = payload as { notification?: { title?: string; body?: string } };
      const title = data.notification?.title || "New notification";
      const body = data.notification?.body || "";
      toast(`${title}: ${body}`, { icon: "🔔" });
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => unsubscribe?.();
  }, []);

  return <>{children}</>;
}
