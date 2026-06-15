import type { Email } from "@/types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function quoteBlock(email: Email): string {
  const date = email.sentAt || email.createdAt;
  const from = email.fromName || email.from;
  const body = email.body.includes("<") ? email.body : email.body.replace(/\n/g, "<br>");
  return `<br><br><div style="border-left:2px solid #ccc;padding-left:12px;margin-left:4px;color:#5f6368">On ${new Date(date).toLocaleString()}, ${from} wrote:<br>${body}</div>`;
}

export function buildReplySubject(subject: string): string {
  if (/^re:\s/i.test(subject)) return subject;
  return `Re: ${subject}`;
}

export function buildForwardSubject(subject: string): string {
  if (/^fwd:\s/i.test(subject)) return subject;
  return `Fwd: ${subject}`;
}

export function buildReplyCompose(
  email: Email,
  userEmail: string,
  mode: "reply" | "reply-all"
) {
  const to =
    mode === "reply"
      ? email.from
      : [email.from, ...email.to, ...(email.cc || [])]
          .filter((e, i, arr) => arr.indexOf(e) === i)
          .filter((e) => e.toLowerCase() !== userEmail.toLowerCase())
          .join(", ");

  const cc =
    mode === "reply-all"
      ? (email.cc || [])
          .filter((e) => e.toLowerCase() !== userEmail.toLowerCase())
          .join(", ")
      : "";

  return {
    to,
    cc,
    subject: buildReplySubject(email.subject),
    body: quoteBlock(email),
    threadId: email.threadId || email.id,
    inReplyTo: email.messageId,
    references: [email.references, email.messageId].filter(Boolean).join(" "),
  };
}

export function buildForwardCompose(email: Email) {
  const body = stripHtml(email.body);
  const forwarded = [
    "",
    "---------- Forwarded message ---------",
    `From: ${email.fromName || email.from} <${email.from}>`,
    `Date: ${new Date(email.sentAt || email.createdAt).toLocaleString()}`,
    `Subject: ${email.subject}`,
    `To: ${email.to.join(", ")}`,
    "",
    body,
  ].join("\n");

  return {
    to: "",
    subject: buildForwardSubject(email.subject),
    body: forwarded.replace(/\n/g, "<br>"),
    threadId: undefined,
  };
}

export function plainTextPreview(html: string, max = 80): string {
  return stripHtml(html).slice(0, max);
}
