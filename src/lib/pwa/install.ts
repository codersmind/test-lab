"use client";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function isInstallPromptSupported(): boolean {
  return typeof window !== "undefined" && "BeforeInstallPromptEvent" in window;
}

export function canShowInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  const dismissed = localStorage.getItem("pwa-install-dismissed");
  if (dismissed) {
    const dismissedAt = Number(dismissed);
    if (!Number.isNaN(dismissedAt) && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
      return false;
    }
  }
  return true;
}

export function dismissInstallPrompt() {
  localStorage.setItem("pwa-install-dismissed", String(Date.now()));
}
