import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendEmailViaSES } from "@/lib/aws/ses";
import { sendPushNotification } from "@/lib/fcm/server";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folder = request.nextUrl.searchParams.get("folder") || "inbox";
  const db = getAdminDb();

  let snapshot;
  if (folder === "starred") {
    snapshot = await db
      .collection("emails")
      .where("userId", "==", user.uid)
      .where("starred", "==", true)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
  } else {
    snapshot = await db
      .collection("emails")
      .where("userId", "==", user.uid)
      .where("folder", "==", folder)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
  }

  const emails = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ emails });
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { to, cc, bcc, subject, body: emailBody, scheduledAt, draftId } = body;
  const db = getAdminDb();
  const now = new Date().toISOString();
  const fromEmail = user.email || process.env.AWS_SES_FROM_EMAIL || "";

  if (scheduledAt && new Date(scheduledAt) > new Date()) {
    const emailId = draftId || uuidv4();
    const emailData = {
      userId: user.uid,
      from: fromEmail,
      to,
      cc: cc || [],
      bcc: bcc || [],
      subject,
      body: emailBody,
      folder: "scheduled",
      read: true,
      starred: false,
      labels: [],
      scheduledAt,
      createdAt: now,
      updatedAt: now,
    };

    if (draftId) {
      await db.collection("emails").doc(draftId).set(emailData, { merge: true });
    } else {
      await db.collection("emails").doc(emailId).set(emailData);
    }

    await db.collection("scheduled_emails").doc(emailId).set({
      userId: user.uid,
      emailId,
      scheduledAt,
      status: "pending",
      createdAt: now,
    });

    return NextResponse.json({ id: emailId, scheduled: true });
  }

  try {
    await sendEmailViaSES({
      from: fromEmail,
      to,
      cc,
      bcc,
      subject,
      html: emailBody,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SES send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const emailId = draftId || uuidv4();
  const sentEmail = {
    userId: user.uid,
    from: fromEmail,
    to,
    cc: cc || [],
    bcc: bcc || [],
    subject,
    body: emailBody,
    folder: "sent",
    read: true,
    starred: false,
    labels: [],
    sentAt: now,
    createdAt: now,
    updatedAt: now,
  };

  if (draftId) {
    await db.collection("emails").doc(draftId).set(sentEmail);
  } else {
    await db.collection("emails").doc(emailId).set(sentEmail);
  }

  for (const recipient of to) {
    const inboxId = uuidv4();
    await db.collection("emails").doc(inboxId).set({
      userId: recipient,
      from: fromEmail,
      to,
      cc: cc || [],
      subject,
      body: emailBody,
      folder: "inbox",
      read: false,
      starred: false,
      labels: [],
      sentAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  const userDoc = await db.collection("users").doc(user.uid).get();
  const fcmToken = userDoc.data()?.fcmToken;
  if (fcmToken) {
    await sendPushNotification(fcmToken, {
      title: "Email sent",
      body: `Your email "${subject}" was sent successfully`,
      data: { url: "/mail/sent" },
    }).catch(() => {});
  }

  return NextResponse.json({ id: emailId, sent: true });
}
