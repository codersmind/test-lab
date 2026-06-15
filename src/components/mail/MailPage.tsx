"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEmails } from "@/hooks/useEmails";
import { MailList } from "@/components/mail/MailList";
import { MailDetail } from "@/components/mail/MailDetail";
import { ComposeModal } from "@/components/mail/ComposeModal";
import { useUIStore } from "@/store/ui-store";
import type { Email, MailFolder } from "@/types";

export function MailPage({ folder }: { folder: MailFolder }) {
  const searchParams = useSearchParams();
  const {
    emails, loading, loadingMore, hasMore, updateEmail, deleteEmail, archiveEmail, loadMore,
  } = useEmails(folder);
  const { selectedEmailId, setSelectedEmailId, openCompose } = useUIStore();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      openCompose({ mode: "new" });
    }
  }, [searchParams, openCompose]);

  const handleSelect = (email: Email) => {
    if (email.folder === "drafts") {
      openCompose({
        mode: "draft",
        to: email.to.join(", "),
        cc: (email.cc || []).join(", "),
        bcc: (email.bcc || []).join(", "),
        subject: email.subject,
        body: email.body.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""),
        draftId: email.id,
        threadId: email.threadId,
      });
      return;
    }

    setSelectedEmail(email);
    setSelectedEmailId(email.id);
    if (!email.read) {
      updateEmail(email.id, { read: true });
    }
  };

  const handleBack = () => {
    setSelectedEmail(null);
    setSelectedEmailId(null);
  };

  return (
    <>
      <div className="flex h-full">
        <div className={`${selectedEmail ? "hidden lg:flex" : "flex"} flex-col flex-1 lg:max-w-[45%] border-r border-gmail-border bg-white`}>
          <MailList
            emails={emails}
            loading={loading}
            folder={folder}
            onSelect={handleSelect}
            onStar={(id, starred) => updateEmail(id, { starred })}
            onDelete={deleteEmail}
            onArchive={archiveEmail}
          />
          {hasMore && !loading && (
            <div className="p-3 border-t border-gmail-border text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm text-gmail-blue hover:underline disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
        <div className={`${selectedEmail ? "flex" : "hidden lg:flex"} flex-1 min-w-0`}>
          <MailDetail
            email={selectedEmail}
            onBack={handleBack}
            onStar={(starred) => selectedEmail && updateEmail(selectedEmail.id, { starred })}
            onDelete={() => {
              if (selectedEmail) {
                deleteEmail(selectedEmail.id);
                handleBack();
              }
            }}
            onArchive={() => {
              if (selectedEmail) {
                archiveEmail(selectedEmail.id);
                handleBack();
              }
            }}
          />
        </div>
      </div>
      <ComposeModal />
    </>
  );
}
