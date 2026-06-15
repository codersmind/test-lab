import { getAdminMessaging } from "@/lib/firebase/admin";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  token: string,
  payload: PushNotificationPayload
) {
  const messaging = getAdminMessaging();

  return messaging.send({
    token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
    webpush: {
      fcmOptions: {
        link: payload.data?.url || "/mail",
      },
    },
  });
}

export async function sendPushToMultiple(
  tokens: string[],
  payload: PushNotificationPayload
) {
  if (!tokens.length) return;

  const messaging = getAdminMessaging();
  await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
  });
}
