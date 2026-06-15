import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  return (
    <AuthGuard>
      <AppShell title="Calendar">
        <CalendarView />
      </AppShell>
    </AuthGuard>
  );
}
