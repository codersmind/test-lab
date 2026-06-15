import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { buildMimeMessage, getAllRecipients } from "@/lib/email/mime";
import { loadAttachmentsForMime } from "@/lib/email/attachment-loader";
import type { SenderIdentity } from "@/lib/email/sender";
import type { EmailAttachment } from "@/types";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface SendEmailOptions {
  sender: SenderIdentity;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmailViaSES(options: SendEmailOptions) {
  const {
    sender, to, cc = [], bcc = [], subject, html, text,
    inReplyTo, references, attachments = [],
  } = options;

  if (!to.length) throw new Error("At least one recipient is required");

  const mimeAttachments = attachments.length
    ? await loadAttachmentsForMime(attachments)
    : [];

  const { raw, messageId } = buildMimeMessage({
    sender, to, cc, bcc, subject, html, text,
    inReplyTo, references,
    attachments: mimeAttachments,
  });

  const command = new SendRawEmailCommand({
    Source: sender.email,
    Destinations: getAllRecipients(to, cc, bcc),
    RawMessage: { Data: Buffer.from(raw) },
    ConfigurationSetName: process.env.AWS_SES_CONFIGURATION_SET || undefined,
  });

  const result = await sesClient.send(command);
  return { messageId: result.MessageId, mimeMessageId: messageId };
}
