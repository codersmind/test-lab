"use client";

import { useEffect, useState } from "react";
import { Bell, Download, Smartphone } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/components/auth/AuthProvider";
import { requestFCMToken } from "@/lib/fcm/client";
import { isStandalonePwa } from "@/lib/pwa/register";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const api = useApi();
  const { getIdToken } = useAuth();
  const [signature, setSignature] = useState("");
  const [replyBehavior, setReplyBehavior] = useState<"reply" | "reply-all">("reply");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
    setInstalled(isStandalonePwa());
  }, []);

  useEffect(() => {
    api.get("/api/users/settings")
      .then((data) => {
        setSignature(data.signature || "");
        setReplyBehavior(data.replyBehavior || "reply");
      })
      .finally(() => setLoading(false));
  }, [api]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/api/users/settings", { signature, replyBehavior });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleEnableNotifications = async () => {
    const token = await requestFCMToken();
    if (!token) {
      setNotificationPermission(
        typeof window !== "undefined" && "Notification" in window
          ? Notification.permission
          : "denied"
      );
      if (Notification.permission === "denied") {
        toast.error("Notifications blocked. Enable them in your browser settings.");
      }
      return;
    }

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
    setNotificationPermission("granted");
    toast.success("Notifications enabled");
  };

  return (
    <AuthGuard>
      <AppShell title="Settings">
        <div className="h-full overflow-y-auto bg-white p-6 max-w-2xl">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-gmail-blue border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-medium mb-1">Email signature</h2>
                <p className="text-sm text-gmail-text-secondary mb-3">
                  Appended to the bottom of every email you send.
                </p>
                <textarea
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gmail-border rounded-lg text-sm resize-none"
                  placeholder="John Doe&#10;mycompany.com"
                />
              </section>

              <section>
                <h2 className="text-lg font-medium mb-1">Default reply behavior</h2>
                <p className="text-sm text-gmail-text-secondary mb-3">
                  Choose the default when replying to a message.
                </p>
                <select
                  value={replyBehavior}
                  onChange={(e) => setReplyBehavior(e.target.value as "reply" | "reply-all")}
                  className="px-3 py-2 border border-gmail-border rounded-lg text-sm"
                >
                  <option value="reply">Reply</option>
                  <option value="reply-all">Reply all</option>
                </select>
              </section>

              <section>
                <h2 className="text-lg font-medium mb-1">App & notifications</h2>
                <p className="text-sm text-gmail-text-secondary mb-4">
                  Install MailBox as an app and control push notifications.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-gmail-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gmail-blue" />
                      <div>
                        <p className="text-sm font-medium">Installed app</p>
                        <p className="text-xs text-gmail-text-secondary">
                          {installed
                            ? "Running as installed PWA"
                            : "Use browser menu → Install app / Add to Home Screen"}
                        </p>
                      </div>
                    </div>
                    {!installed && (
                      <Download className="w-4 h-4 text-gmail-text-secondary" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gmail-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gmail-blue" />
                      <div>
                        <p className="text-sm font-medium">Push notifications</p>
                        <p className="text-xs text-gmail-text-secondary">
                          {notificationPermission === "granted"
                            ? "Enabled — you will be notified for new mail"
                            : notificationPermission === "denied"
                              ? "Blocked in browser settings"
                              : "Get alerts for new incoming email"}
                        </p>
                      </div>
                    </div>
                    {notificationPermission !== "granted" && (
                      <button
                        onClick={handleEnableNotifications}
                        className="px-3 py-1.5 bg-gmail-blue text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gmail-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
