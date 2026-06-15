"use client";

import { useState } from "react";
import { useEmails } from "@/hooks/useEmails";
import { MailList } from "@/components/mail/MailList";
import { MailDetail } from "@/components/mail/MailDetail";
import { ComposeModal } from "@/components/mail/ComposeModal";
import { useUIStore } from "@/store/ui-store";
import type { Email, MailFolder } from "@/types";

export function MailPage({ folder }: { folder: MailFolder }) {
  const { emails, loading, updateEmail, deleteEmail } = useEmails(folder);
  const { selectedEmailId, setSelectedEmailId } = useUIStore();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const handleSelect = (email: Email) => {
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
        <div
          className={`${
            selectedEmail ? "hidden lg:flex" : "flex"
          } flex-col flex-1 lg:max-w-[45%] border-r border-gmail-border bg-white`}
        >
          <MailList
            emails={emails}
            loading={loading}
            onSelect={handleSelect}
            onStar={(id, starred) => updateEmail(id, { starred })}
            onDelete={deleteEmail}
            onMarkRead={(id, read) => updateEmail(id, { read })}
          />
        </div>
        <div
          className={`${
            selectedEmail ? "flex" : "hidden lg:flex"
          } flex-1 min-w-0`}
        >
          <MailDetail
            email={selectedEmail}
            onBack={handleBack}
            onStar={(starred) =>
              selectedEmail && updateEmail(selectedEmail.id, { starred })
            }
            onDelete={() => {
              if (selectedEmail) {
                deleteEmail(selectedEmail.id);
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
