import { AuthGuard, AdminGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { UsersManager } from "@/components/admin/UsersManager";

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminGuard>
        <AppShell title="Admin">
          <UsersManager />
        </AppShell>
      </AdminGuard>
    </AuthGuard>
  );
}
