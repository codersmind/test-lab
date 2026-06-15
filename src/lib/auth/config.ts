export function getAllowedEmailDomain(): string {
  return (process.env.ALLOWED_EMAIL_DOMAIN || "").toLowerCase().trim();
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailOnAllowedDomain(email: string): boolean {
  const domain = getAllowedEmailDomain();
  if (!domain) return true;
  return email.toLowerCase().endsWith(`@${domain}`);
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  if (!admins.length) return false;
  return admins.includes(email.toLowerCase());
}
