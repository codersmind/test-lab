"use client";

import { useEffect } from "react";
import { onForegroundMessage } from "@/lib/fcm/client";
import toast from "react-hot-toast";

export function FCMProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    onForegroundMessage((payload) => {
      const data = payload as {
        notification?: { title?: string; body?: string };
        data?: Record<string, string>;
      };
      const title = data.notification?.title || "MailBox";
      const body = data.notification?.body || "";

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: data.data?.emailId || "mailbox-foreground",
          data: data.data,
        });
      } else {
        toast(`${title}: ${body}`, { icon: "🔔" });
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => unsubscribe?.();
  }, []);

  return <>{children}</>;
}
