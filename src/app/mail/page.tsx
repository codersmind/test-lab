import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { MailPage } from "@/components/mail/MailPage";

export default function InboxPage() {
  return (
    <AuthGuard>
      <AppShell title="Inbox">
        <MailPage folder="inbox" />
      </AppShell>
    </AuthGuard>
  );
}
