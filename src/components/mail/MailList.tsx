"use client";

import { Star, Trash2, Archive, MailOpen, Paperclip } from "lucide-react";
import { format } from "date-fns";
import type { Email, MailFolder } from "@/types";
import { useUIStore } from "@/store/ui-store";
import { plainTextPreview } from "@/lib/email/compose-helpers";

interface MailListProps {
  emails: Email[];
  loading: boolean;
  folder: MailFolder;
  onSelect: (email: Email) => void;
  onStar: (id: string, starred: boolean) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

interface ThreadGroup {
  threadId: string;
  emails: Email[];
  latest: Email;
}

function groupByThread(emails: Email[]): ThreadGroup[] {
  const map = new Map<string, Email[]>();

  for (const email of emails) {
    const key = email.threadId || email.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(email);
  }

  return Array.from(map.entries()).map(([threadId, threadEmails]) => {
    const sorted = [...threadEmails].sort(
      (a, b) =>
        new Date(b.sentAt || b.createdAt).getTime() -
        new Date(a.sentAt || a.createdAt).getTime()
    );
    return { threadId, emails: sorted, latest: sorted[0] };
  }).sort(
    (a, b) =>
      new Date(b.latest.sentAt || b.latest.createdAt).getTime() -
      new Date(a.latest.sentAt || a.latest.createdAt).getTime()
  );
}

export function MailList({
  emails,
  loading,
  folder,
  onSelect,
  onStar,
  onDelete,
  onArchive,
}: MailListProps) {
  const { selectedEmailId } = useUIStore();
  const threads = groupByThread(emails);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-gmail-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!threads.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gmail-text-secondary">
        <MailOpen className="w-16 h-16 mb-4 opacity-40" />
        <p>No messages</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {threads.map(({ threadId, emails: threadEmails, latest: email }) => {
        const threadCount = threadEmails.length;
        const hasUnread = threadEmails.some((e) => !e.read);

        return (
          <div
            key={threadId}
            onClick={() => onSelect(email)}
            className={`flex items-center gap-2 px-2 sm:px-4 py-2 border-b border-gmail-border cursor-pointer transition-colors group ${
              selectedEmailId === email.id ? "bg-gmail-selected" : "hover:shadow-sm hover:z-10 bg-white"
            } ${hasUnread ? "font-semibold" : ""}`}
          >
            {!email.read && (
              <span className="w-2 h-2 rounded-full bg-gmail-blue flex-shrink-0" />
            )}
            {email.read && <span className="w-2 flex-shrink-0" />}

            <button
              onClick={(e) => { e.stopPropagation(); onStar(email.id, !email.starred); }}
              className="p-1 flex-shrink-0"
            >
              <Star className={`w-4 h-4 ${email.starred ? "fill-yellow-400 text-yellow-400" : "text-gmail-text-secondary opacity-0 group-hover:opacity-100"}`} />
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-4">
              <span className="w-24 sm:w-40 truncate text-sm flex-shrink-0">
                {email.folder === "sent" || email.folder === "drafts"
                  ? `To: ${email.to.join(", ")}`
                  : email.fromName || email.from}
              </span>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {(email.attachments?.length ?? 0) > 0 && (
                  <Paperclip className="w-3.5 h-3.5 text-gmail-text-secondary flex-shrink-0" />
                )}
                <span className="truncate text-sm">
                  {threadCount > 1 && <span className="text-gmail-text-secondary">({threadCount}) </span>}
                  {email.subject || "(no subject)"}
                </span>
                <span className="hidden md:inline text-gmail-text-secondary text-sm truncate font-normal">
                  — {plainTextPreview(email.body)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs text-gmail-text-secondary group-hover:hidden font-normal">
                {format(new Date(email.sentAt || email.createdAt), "MMM d")}
              </span>
              <div className="hidden group-hover:flex items-center gap-1">
                {folder === "inbox" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onArchive(email.id); }}
                    className="p-1.5 rounded-full hover:bg-gmail-hover"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4 text-gmail-text-secondary" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(email.id); }}
                  className="p-1.5 rounded-full hover:bg-gmail-hover"
                >
                  <Trash2 className="w-4 h-4 text-gmail-text-secondary" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
