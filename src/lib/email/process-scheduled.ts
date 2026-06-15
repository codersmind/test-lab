import { getAdminDb } from "@/lib/firebase/admin";
import { sendEmailViaSES } from "@/lib/aws/ses";
import { sendPushNotification } from "@/lib/fcm/server";
import { getSenderFromEmailRecord } from "@/lib/email/get-sender";
import { deliverToInternalInboxes } from "@/lib/email/deliver-internal";

export async function processScheduledEmails() {
  const db = getAdminDb();
  const now = new Date().toISOString();

  const snapshot = await db
    .collection("scheduled_emails")
    .where("status", "==", "pending")
    .where("scheduledAt", "<=", now)
    .limit(20)
    .get();

  const results = [];

  for (const schedDoc of snapshot.docs) {
    const schedData = schedDoc.data();
    const emailDoc = await db.collection("emails").doc(schedData.emailId).get();

    if (!emailDoc.exists) {
      await schedDoc.ref.update({ status: "failed" });
      continue;
    }

    const email = emailDoc.data()!;

    try {
      const sender = getSenderFromEmailRecord({
        from: email.from,
        fromName: email.fromName,
      });

      const sendResult =       await sendEmailViaSES({
        sender,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        html: email.body,
        inReplyTo: email.inReplyTo,
        references: email.references,
        attachments: email.attachments || [],
      });

      await emailDoc.ref.update({
        folder: "sent",
        sentAt: now,
        scheduledAt: null,
        messageId: sendResult.mimeMessageId,
        updatedAt: now,
      });

      await schedDoc.ref.update({ status: "sent" });

      await deliverToInternalInboxes({
        fromEmail: email.from,
        fromName: email.fromName || email.from,
        to: email.to,
        cc: email.cc || [],
        subject: email.subject,
        body: email.body,
        sentAt: now,
        threadId: email.threadId || schedData.emailId,
        messageId: sendResult.mimeMessageId || schedData.emailId,
        inReplyTo: email.inReplyTo,
        references: email.references,
        attachments: email.attachments || [],
      });

      const userDoc = await db.collection("users").doc(schedData.userId).get();
      const fcmToken = userDoc.data()?.fcmToken;
      if (fcmToken) {
        await sendPushNotification(fcmToken, {
          title: "Scheduled email sent",
          body: `"${email.subject}" was sent from ${email.from}`,
          data: { url: "/mail/sent" },
        }).catch(() => {});
      }

      results.push({ id: schedData.emailId, status: "sent" });
    } catch {
      await schedDoc.ref.update({ status: "failed" });
      results.push({ id: schedData.emailId, status: "failed" });
    }
  }

  return { processed: results.length, results };
}
