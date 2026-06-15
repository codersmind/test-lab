"use client";

import { Star, Trash2, Archive, MailOpen } from "lucide-react";
import { format } from "date-fns";
import type { Email } from "@/types";
import { useUIStore } from "@/store/ui-store";

interface MailListProps {
  emails: Email[];
  loading: boolean;
  onSelect: (email: Email) => void;
  onStar: (id: string, starred: boolean) => void;
  onDelete: (id: string) => void;
  onMarkRead: (id: string, read: boolean) => void;
}

export function MailList({
  emails,
  loading,
  onSelect,
  onStar,
  onDelete,
  onMarkRead,
}: MailListProps) {
  const { searchQuery, selectedEmailId } = useUIStore();

  const filtered = emails.filter(
    (e) =>
      !searchQuery ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-gmail-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gmail-text-secondary">
        <MailOpen className="w-16 h-16 mb-4 opacity-40" />
        <p>No messages</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {filtered.map((email) => (
        <div
          key={email.id}
          onClick={() => onSelect(email)}
          className={`flex items-center gap-2 px-2 sm:px-4 py-2 border-b border-gmail-border cursor-pointer transition-colors group ${
            selectedEmailId === email.id
              ? "bg-gmail-selected"
              : "hover:shadow-sm hover:z-10 bg-white"
          } ${!email.read ? "font-semibold" : ""}`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStar(email.id, !email.starred);
            }}
            className="p-1 flex-shrink-0"
          >
            <Star
              className={`w-4 h-4 ${
                email.starred
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gmail-text-secondary opacity-0 group-hover:opacity-100"
              }`}
            />
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-4">
            <span className="w-24 sm:w-40 truncate text-sm flex-shrink-0">
              {email.folder === "sent" || email.folder === "drafts"
                ? `To: ${email.to.join(", ")}`
                : email.from}
            </span>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="truncate text-sm">{email.subject || "(no subject)"}</span>
              <span className="hidden md:inline text-gmail-text-secondary text-sm truncate">
                — {email.body.replace(/<[^>]*>/g, "").slice(0, 80)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs text-gmail-text-secondary group-hover:hidden">
              {format(new Date(email.sentAt || email.createdAt), "MMM d")}
            </span>
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(email.id, !email.read);
                }}
                className="p-1.5 rounded-full hover:bg-gmail-hover"
              >
                <Archive className="w-4 h-4 text-gmail-text-secondary" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(email.id);
                }}
                className="p-1.5 rounded-full hover:bg-gmail-hover"
              >
                <Trash2 className="w-4 h-4 text-gmail-text-secondary" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
