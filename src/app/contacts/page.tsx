import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { ContactsView } from "@/components/contacts/ContactsView";

export default function ContactsPage() {
  return (
    <AuthGuard>
      <AppShell title="Contacts">
        <ContactsView />
      </AppShell>
    </AuthGuard>
  );
}
