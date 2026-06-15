"use client";

import { getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase/client";
import { getServiceWorkerRegistration } from "@/lib/pwa/register";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export async function requestFCMToken(): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging || !VAPID_KEY) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await getServiceWorkerRegistration();
    if (!registration) return null;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
}

export async function onForegroundMessage(
  callback: (payload: unknown) => void
) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, callback);
}
