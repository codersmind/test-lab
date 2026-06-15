"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import {
  type BeforeInstallPromptEvent,
  canShowInstallPrompt,
  dismissInstallPrompt,
  isInstallPromptSupported,
} from "@/lib/pwa/install";
import { isStandalonePwa } from "@/lib/pwa/register";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalonePwa() || !canShowInstallPrompt()) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setVisible(false);
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[60] bg-white border border-gmail-border rounded-xl shadow-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gmail-blue/10 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-gmail-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Install MailBox</p>
          <p className="text-xs text-gmail-text-secondary mt-1">
            Add to your home screen for quick access on mobile and desktop.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-gmail-blue text-white text-xs font-medium rounded-lg hover:bg-blue-700"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-gmail-text-secondary hover:bg-gmail-hover rounded-lg"
            >
              Not now
            </button>
          </div>
          {!isInstallPromptSupported() && (
            <p className="text-xs text-gmail-text-secondary mt-2">
              Use your browser menu → &quot;Install app&quot; or &quot;Add to Home Screen&quot;.
            </p>
          )}
        </div>
        <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-gmail-hover flex-shrink-0">
          <X className="w-4 h-4 text-gmail-text-secondary" />
        </button>
      </div>
    </div>
  );
}
