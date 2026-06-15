import { simpleParser, ParsedMail, AddressObject } from "mailparser";
import { getAdminDb } from "@/lib/firebase/admin";
import { getInboundEmailFromS3, buildInboundS3Key, uploadAttachmentToS3 } from "@/lib/aws/s3";
import { sendPushNotification } from "@/lib/fcm/server";
import { isEmailOnAllowedDomain } from "@/lib/auth/config";
import { v4 as uuidv4 } from "uuid";

export interface SesInboundNotification {
  notificationType: string;
  mail: {
    messageId: string;
    source: string;
    timestamp: string;
    destination: string[];
    commonHeaders?: {
      from?: string[];
      to?: string[];
      subject?: string;
    };
  };
  receipt: {
    recipients: string[];
    action?: {
      type: string;
      bucketName?: string;
      objectKey?: string;
    };
    actions?: Array<{
      type: string;
      bucketName?: string;
      objectKey?: string;
    }>;
  };
}

function extractAddress(value: string | undefined): string {
  if (!value) return "";
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

function addressesFromParsed(
  field: AddressObject | AddressObject[] | undefined
): string[] {
  if (!field) return [];
  const list = Array.isArray(field) ? field : [field];
  return list.flatMap((item) =>
    (item.value || []).map((addr) => (addr.address || "").toLowerCase()).filter(Boolean)
  );
}

function resolveS3ObjectKey(notification: SesInboundNotification): string {
  const actions = notification.receipt.actions || [];
  const s3Action = actions.find((a) => a.type === "S3");
  if (s3Action?.objectKey) return s3Action.objectKey;

  if (notification.receipt.action?.type === "S3" && notification.receipt.action.objectKey) {
    return notification.receipt.action.objectKey;
  }

  return buildInboundS3Key(notification.mail.messageId);
}

async function parseRawEmail(raw: Buffer): Promise<ParsedMail> {
  return simpleParser(raw);
}

function getEmailBody(parsed: ParsedMail): string {
  if (parsed.html) {
    return typeof parsed.html === "string" ? parsed.html : String(parsed.html);
  }
  if (parsed.text) {
    const text = typeof parsed.text === "string" ? parsed.text : String(parsed.text);
    return text.replace(/\n/g, "<br>\n");
  }
  return "";
}

function getFromName(parsed: ParsedMail, fallbackEmail: string): string {
  const from = parsed.from?.value?.[0];
  return from?.name || fallbackEmail.split("@")[0] || "Unknown";
}

export async function processInboundNotification(
  notification: SesInboundNotification
): Promise<{ saved: number; skipped: number }> {
  if (notification.notificationType !== "Received") {
    return { saved: 0, skipped: 0 };
  }

  const objectKey = resolveS3ObjectKey(notification);
  const rawEmail = await getInboundEmailFromS3(objectKey);
  const parsed = await parseRawEmail(rawEmail);

  const fromEmail =
    extractAddress(parsed.from?.text) ||
    extractAddress(notification.mail.source) ||
    notification.mail.commonHeaders?.from?.[0] ||
    "unknown@unknown";

  const fromName = getFromName(parsed, fromEmail);
  const subject =
    parsed.subject ||
    notification.mail.commonHeaders?.subject?.[0] ||
    "(no subject)";
  const body = getEmailBody(parsed);

  const toAddresses = [
    ...addressesFromParsed(parsed.to),
    ...(notification.receipt.recipients || []).map((r) => r.toLowerCase()),
    ...(notification.mail.destination || []).map((r) => r.toLowerCase()),
  ];

  const uniqueRecipients = [...new Set(toAddresses)].filter((email) =>
    isEmailOnAllowedDomain(email)
  );

  const db = getAdminDb();
  const now = new Date().toISOString();
  const sesMessageId = notification.mail.messageId;
  let saved = 0;
  let skipped = 0;

  for (const recipientEmail of uniqueRecipients) {
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", recipientEmail)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      skipped++;
      continue;
    }

    const userId = userSnapshot.docs[0].id;

    const duplicate = await db
      .collection("emails")
      .where("sesMessageId", "==", sesMessageId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!duplicate.empty) {
      skipped++;
      continue;
    }

    const emailId = uuidv4();
    const inReplyTo = parsed.inReplyTo || null;
    const references = Array.isArray(parsed.references)
      ? parsed.references.join(" ")
      : parsed.references || null;

    let threadId = emailId;
    if (inReplyTo) {
      const parent = await db
        .collection("emails")
        .where("messageId", "==", inReplyTo)
        .limit(1)
        .get();
      if (!parent.empty) {
        threadId = parent.docs[0].data().threadId || parent.docs[0].id;
      }
    }

    const storedAttachments = [];
    for (const att of parsed.attachments || []) {
      if (!att.content || !att.filename) continue;
      const content = Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content);
      const s3Key = await uploadAttachmentToS3(
        userId,
        att.filename,
        att.contentType || "application/octet-stream",
        content
      );
      storedAttachments.push({
        id: uuidv4(),
        filename: att.filename,
        contentType: att.contentType || "application/octet-stream",
        size: content.length,
        s3Key,
      });
    }

    await db.collection("emails").doc(emailId).set({
      userId,
      from: fromEmail,
      fromName,
      to: uniqueRecipients,
      cc: addressesFromParsed(parsed.cc),
      subject,
      body,
      folder: "inbox",
      read: false,
      starred: false,
      labels: [],
      sesMessageId,
      external: true,
      threadId,
      messageId: parsed.messageId || sesMessageId,
      inReplyTo,
      references,
      attachments: storedAttachments,
      sentAt: parsed.date?.toISOString() || notification.mail.timestamp || now,
      createdAt: now,
      updatedAt: now,
    });

    const fcmToken = userSnapshot.docs[0].data()?.fcmToken;
    if (fcmToken) {
      await sendPushNotification(fcmToken, {
        title: `New mail from ${fromName}`,
        body: subject,
        data: { url: "/mail" },
      }).catch(() => {});
    }

    saved++;
  }

  return { saved, skipped };
}
