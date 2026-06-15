import { getAdminDb } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";
import type { EmailAttachment } from "@/types";

export async function deliverToInternalInboxes(params: {
  fromEmail: string;
  fromName: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  sentAt: string;
  threadId: string;
  messageId: string;
  inReplyTo?: string;
  references?: string;
  attachments?: EmailAttachment[];
}) {
  const db = getAdminDb();
  const {
    fromEmail, fromName, to, cc = [], subject, body, sentAt,
    threadId, messageId, inReplyTo, references, attachments = [],
  } = params;

  for (const recipient of to) {
    const recipientDoc = await db
      .collection("users")
      .where("email", "==", recipient.trim().toLowerCase())
      .limit(1)
      .get();

    if (recipientDoc.empty) continue;

    const recipientUid = recipientDoc.docs[0].id;
    await db.collection("emails").doc(uuidv4()).set({
      userId: recipientUid,
      from: fromEmail,
      fromName,
      to,
      cc,
      subject,
      body,
      folder: "inbox",
      read: false,
      starred: false,
      labels: [],
      threadId,
      messageId,
      inReplyTo: inReplyTo || null,
      references: references || null,
      attachments,
      sentAt,
      createdAt: sentAt,
      updatedAt: sentAt,
    });
  }
}
