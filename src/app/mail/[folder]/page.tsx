import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { MailPage } from "@/components/mail/MailPage";
import type { MailFolder } from "@/types";

const titles: Record<string, string> = {
  starred: "Starred",
  sent: "Sent",
  drafts: "Drafts",
  scheduled: "Scheduled",
  archive: "Archive",
  trash: "Trash",
};

export default async function FolderPage({
  params,
}: {
  params: Promise<{ folder: string }>;
}) {
  const { folder } = await params;
  const mailFolder = folder as MailFolder;

  return (
    <AuthGuard>
      <AppShell title={titles[folder] || "Mail"}>
        <MailPage folder={mailFolder} />
      </AppShell>
    </AuthGuard>
  );
}
