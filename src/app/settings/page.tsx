"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { useApi } from "@/hooks/useApi";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const api = useApi();
  const [signature, setSignature] = useState("");
  const [replyBehavior, setReplyBehavior] = useState<"reply" | "reply-all">("reply");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
