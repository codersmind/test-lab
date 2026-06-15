import { isEmailOnAllowedDomain, getAllowedEmailDomain } from "@/lib/auth/config";

export interface SenderIdentity {
  email: string;
  name: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Resolves the outbound sender from the authenticated user.
 * Always uses the logged-in user's email (e.g. john@mydomain.com).
 */
export function resolveSenderIdentity(
  userEmail: string | undefined,
  displayName?: string | null
): SenderIdentity {
  if (!userEmail) {
    throw new Error("Authenticated user email is required to send mail");
  }

  const email = normalizeEmail(userEmail);

  if (!isEmailOnAllowedDomain(email)) {
    const domain = getAllowedEmailDomain() || "your domain";
    throw new Error(`Sender must use an @${domain} address`);
  }

  const name = (displayName || email.split("@")[0] || "User").trim();

  return { email, name };
}

export function formatMailbox(name: string, email: string): string {
  const safeName = name.replace(/[<>"]/g, "").trim() || email.split("@")[0];
  return `${safeName} <${email}>`;
}

export function extractDomain(email: string): string {
  return email.split("@")[1] || getAllowedEmailDomain() || "localhost";
}
