import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendEmailViaSES } from "@/lib/aws/ses";
import { sendPushNotification } from "@/lib/fcm/server";

async function processScheduledEmails() {
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
      await sendEmailViaSES({
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        html: email.body,
      });

      await emailDoc.ref.update({
        folder: "sent",
        sentAt: now,
        scheduledAt: null,
        updatedAt: now,
      });

      await schedDoc.ref.update({ status: "sent" });

      const userDoc = await db.collection("users").doc(schedData.userId).get();
      const fcmToken = userDoc.data()?.fcmToken;
      if (fcmToken) {
        await sendPushNotification(fcmToken, {
          title: "Scheduled email sent",
          body: `"${email.subject}" was sent as scheduled`,
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

async function authorize(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const isCron =
    cronSecret === process.env.CRON_SECRET ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (isCron) return true;

  const user = await verifyAuth(request);
  return Boolean(user);
}

export async function GET(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processScheduledEmails();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processScheduledEmails();
  return NextResponse.json(result);
}
