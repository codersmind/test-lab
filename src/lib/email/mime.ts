import { v4 as uuidv4 } from "uuid";
import { formatMailbox, extractDomain, type SenderIdentity } from "@/lib/email/sender";
import type { MimeAttachmentPart } from "@/lib/email/attachment-loader";

export interface MimeEmailOptions {
  sender: SenderIdentity;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: MimeAttachmentPart[];
}

export interface BuiltMimeMessage {
  raw: string;
  messageId: string;
}

function encodeHeaderValue(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  const encoded = Buffer.from(value, "utf-8").toString("base64");
  return `=?UTF-8?B?${encoded}?=`;
}

function encodeFilename(filename: string): string {
  if (/^[\x20-\x7E]*$/.test(filename)) return `filename="${filename}"`;
  const encoded = Buffer.from(filename, "utf-8").toString("base64");
  return `filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function wrapHtmlDocument(body: string, subject: string): string {
  if (/<html[\s>]/i.test(body)) return body;
  const content = body.includes("<") ? body : body.replace(/\n/g, "<br>\n");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${subject}</title></head><body style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#202124;padding:16px">${content}</body></html>`;
}

function formatRfc2822Date(date = new Date()): string {
  return date.toUTCString().replace("GMT", "+0000");
}

function buildBodyParts(html: string, subject: string, text?: string): string {
  const altBoundary = `----=_Alt_${uuidv4().replace(/-/g, "")}`;
  const plainText = text || htmlToPlainText(html);
  const htmlDocument = wrapHtmlDocument(html, subject);

  return [
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(plainText, "utf-8").toString("base64"),
    `--${altBoundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(htmlDocument, "utf-8").toString("base64"),
    `--${altBoundary}--`,
  ].join("\r\n");
}

function buildAttachmentParts(attachments: MimeAttachmentPart[], boundary: string): string {
  return attachments
    .map((att) =>
      [
        `--${boundary}`,
        `Content-Type: ${att.contentType}; ${encodeFilename(att.filename)}`,
        "Content-Transfer-Encoding: base64",
        "Content-Disposition: attachment",
        "",
        att.content.toString("base64"),
      ].join("\r\n")
    )
    .join("\r\n");
}

export function buildMimeMessage(options: MimeEmailOptions): BuiltMimeMessage {
  const {
    sender, to, cc = [], bcc = [], subject, html,
    inReplyTo, references, attachments = [],
  } = options;

  const fromHeader = formatMailbox(sender.name, sender.email);
  const domain = extractDomain(sender.email);
  const messageId = `<${uuidv4()}@${domain}>`;
  const date = formatRfc2822Date();
  const hasAttachments = attachments.length > 0;
  const mixedBoundary = `----=_Mixed_${uuidv4().replace(/-/g, "")}`;

  const headers = [
    `From: ${fromHeader}`,
    `To: ${to.join(", ")}`,
    cc.length ? `Cc: ${cc.join(", ")}` : null,
    bcc.length ? `Bcc: ${bcc.join(", ")}` : null,
    `Subject: ${encodeHeaderValue(subject)}`,
    `Reply-To: ${fromHeader}`,
    `Date: ${date}`,
    `Message-ID: ${messageId}`,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : null,
    references ? `References: ${references}` : null,
    "MIME-Version: 1.0",
    hasAttachments
      ? `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`
      : `Content-Type: multipart/alternative; boundary="----=_Alt_${uuidv4().replace(/-/g, "")}"`,
  ].filter(Boolean) as string[];

  let body: string;

  if (hasAttachments) {
    const bodyPart = buildBodyParts(html, subject, options.text);
    const attachmentParts = buildAttachmentParts(attachments, mixedBoundary);
    body = [
      "",
      `--${mixedBoundary}`,
      bodyPart,
      attachmentParts,
      `--${mixedBoundary}--`,
    ].join("\r\n");
  } else {
    const altBoundary = headers[headers.length - 1].match(/boundary="([^"]+)"/)?.[1]!;
    const plainText = options.text || htmlToPlainText(html);
    const htmlDocument = wrapHtmlDocument(html, subject);
    body = [
      "",
      `--${altBoundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(plainText, "utf-8").toString("base64"),
      `--${altBoundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(htmlDocument, "utf-8").toString("base64"),
      `--${altBoundary}--`,
    ].join("\r\n");
  }

  return { raw: `${headers.join("\r\n")}${body}\r\n`, messageId };
}

export function getAllRecipients(to: string[], cc: string[] = [], bcc: string[] = []): string[] {
  return [...new Set([...to, ...cc, ...bcc].map((e) => e.trim().toLowerCase()).filter(Boolean))];
}
