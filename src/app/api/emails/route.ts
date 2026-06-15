import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendEmailViaSES } from "@/lib/aws/ses";
import { sendPushNotification } from "@/lib/fcm/server";
import { getSenderForUser } from "@/lib/email/get-sender";
import { deliverToInternalInboxes } from "@/lib/email/deliver-internal";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folder = request.nextUrl.searchParams.get("folder") || "inbox";
  const search = request.nextUrl.searchParams.get("search");
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "50"), 100);
  const db = getAdminDb();

  if (search) {
    const snapshot = await db
      .collection("emails")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const q = search.toLowerCase();
    const emails = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown> & { id: string })
      .filter((e) => {
        const subject = String(e.subject || "").toLowerCase();
        const from = String(e.from || "").toLowerCase();
        const body = String(e.body || "").toLowerCase();
        const to = Array.isArray(e.to) ? e.to : [];
        return (
          subject.includes(q) ||
          from.includes(q) ||
          body.includes(q) ||
          to.some((t) => String(t).toLowerCase().includes(q))
        );
      })
      .slice(0, limit);

    return NextResponse.json({ emails });
  }

  let query;
  if (folder === "starred") {
    query = db
      .collection("emails")
      .where("userId", "==", user.uid)
      .where("starred", "==", true)
      .orderBy("createdAt", "desc");
  } else {
    query = db
      .collection("emails")
      .where("userId", "==", user.uid)
      .where("folder", "==", folder)
      .orderBy("createdAt", "desc");
  }

  if (cursor) {
    const cursorDoc = await db.collection("emails").doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.limit(limit).get();
  const emails = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const nextCursor = emails.length === limit ? emails[emails.length - 1].id : null;

  return NextResponse.json({ emails, nextCursor });
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    to, cc, bcc, subject, body: emailBody, scheduledAt, draftId,
    threadId, inReplyTo, references, attachments = [],
  } = body;
  const db = getAdminDb();
  const now = new Date().toISOString();

  let sender;
  try {
    sender = await getSenderForUser({ uid: user.uid, email: user.email, name: user.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid sender";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const settingsDoc = await db.collection("user_settings").doc(user.uid).get();
  const signature = settingsDoc.data()?.signature || "";
  const finalBody = signature
    ? `${emailBody}<br><br>--<br>${signature.replace(/\n/g, "<br>")}`
    : emailBody;

  const fromEmail = sender.email;
  const fromName = sender.name;
  const resolvedThreadId = threadId || uuidv4();

  if (scheduledAt && new Date(scheduledAt) > new Date()) {
    const emailId = draftId || uuidv4();
    const emailData = {
      userId: user.uid,
      from: fromEmail,
      fromName,
      to, cc: cc || [], bcc: bcc || [],
      subject, body: finalBody,
      folder: "scheduled",
      read: true, starred: false, labels: [],
      threadId: resolvedThreadId,
      inReplyTo: inReplyTo || null,
      references: references || null,
      attachments,
      scheduledAt, createdAt: now, updatedAt: now,
    };

    if (draftId) {
      await db.collection("emails").doc(draftId).set(emailData, { merge: true });
    } else {
      await db.collection("emails").doc(emailId).set(emailData);
    }

    await db.collection("scheduled_emails").doc(emailId).set({
      userId: user.uid, emailId, scheduledAt, status: "pending", createdAt: now,
    });

    return NextResponse.json({ id: emailId, scheduled: true, from: fromEmail });
  }

  let mimeMessageId: string | undefined;
  try {
    const result = await sendEmailViaSES({
      sender, to, cc, bcc,
      subject,
      html: finalBody,
      inReplyTo,
      references,
      attachments,
    });
    mimeMessageId = result.mimeMessageId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "SES send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const emailId = draftId || uuidv4();
  const sentEmail = {
    userId: user.uid,
    from: fromEmail,
    fromName,
    to, cc: cc || [], bcc: bcc || [],
    subject, body: finalBody,
    folder: "sent",
    read: true, starred: false, labels: [],
    threadId: resolvedThreadId,
    messageId: mimeMessageId,
    inReplyTo: inReplyTo || null,
    references: references || null,
    attachments,
    sentAt: now, createdAt: now, updatedAt: now,
  };

  if (draftId) {
    await db.collection("emails").doc(draftId).set(sentEmail);
  } else {
    await db.collection("emails").doc(emailId).set(sentEmail);
  }

  await deliverToInternalInboxes({
    fromEmail, fromName, to,
    cc: cc || [],
    subject, body: finalBody, sentAt: now,
    threadId: resolvedThreadId,
    messageId: mimeMessageId || emailId,
    inReplyTo, references,
    attachments,
  });

  const userDoc = await db.collection("users").doc(user.uid).get();
  const fcmToken = userDoc.data()?.fcmToken;
  if (fcmToken) {
    await sendPushNotification(fcmToken, {
      title: "Email sent",
      body: `Your email "${subject}" was sent from ${fromEmail}`,
      data: { url: "/mail/sent" },
    }).catch(() => {});
  }

  return NextResponse.json({ id: emailId, sent: true, from: fromEmail, threadId: resolvedThreadId });
}
