"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { requestFCMToken } from "@/lib/fcm/client";

export function NotificationPrompt() {
  const { user, getIdToken } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    const dismissed = sessionStorage.getItem("notification-prompt-dismissed");
    if (dismissed) return;

    const timer = window.setTimeout(() => setVisible(true), 2000);
    return () => window.clearTimeout(timer);
  }, [user]);

  if (!visible) return null;

  const handleEnable = async () => {
    const token = await requestFCMToken();
    if (token && user) {
      const idToken = await getIdToken();
      if (idToken) {
        await fetch("/api/notifications/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ fcmToken: token }),
        });
      }
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("notification-prompt-dismissed", "1");
    setVisible(false);
  };

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[60] bg-white border border-gmail-border rounded-xl shadow-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gmail-blue/10 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-gmail-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Enable notifications</p>
          <p className="text-xs text-gmail-text-secondary mt-1">
            Get notified when you receive new email, even when MailBox is in the background.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              className="px-3 py-1.5 bg-gmail-blue text-white text-xs font-medium rounded-lg hover:bg-blue-700"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-gmail-text-secondary hover:bg-gmail-hover rounded-lg"
            >
              Later
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-gmail-hover flex-shrink-0">
          <X className="w-4 h-4 text-gmail-text-secondary" />
        </button>
      </div>
    </div>
  );
}
