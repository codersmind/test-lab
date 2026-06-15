"use client";

import { ArrowLeft, Star, Trash2, Reply, Forward } from "lucide-react";
import { format } from "date-fns";
import type { Email } from "@/types";
import { useUIStore } from "@/store/ui-store";

interface MailDetailProps {
  email: Email | null;
  onBack: () => void;
  onStar: (starred: boolean) => void;
  onDelete: () => void;
}

export function MailDetail({ email, onBack, onStar, onDelete }: MailDetailProps) {
  const { setComposeOpen } = useUIStore();

  if (!email) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full text-gmail-text-secondary bg-white">
        <p>Select a message to read</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gmail-border">
        <button onClick={onBack} className="lg:hidden p-2 rounded-full hover:bg-gmail-hover">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onStar(!email.starred)}
          className="p-2 rounded-full hover:bg-gmail-hover"
        >
          <Star
            className={`w-5 h-5 ${
              email.starred ? "fill-yellow-400 text-yellow-400" : "text-gmail-text-secondary"
            }`}
          />
        </button>
        <button onClick={onDelete} className="p-2 rounded-full hover:bg-gmail-hover">
          <Trash2 className="w-5 h-5 text-gmail-text-secondary" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setComposeOpen(true)}
          className="p-2 rounded-full hover:bg-gmail-hover"
        >
          <Reply className="w-5 h-5 text-gmail-text-secondary" />
        </button>
        <button className="p-2 rounded-full hover:bg-gmail-hover">
          <Forward className="w-5 h-5 text-gmail-text-secondary" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-normal mb-4">{email.subject}</h1>

        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gmail-blue text-white flex items-center justify-center font-medium flex-shrink-0">
            {email.from[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-medium">{email.from}</span>
                <span className="text-gmail-text-secondary text-sm ml-2">
                  &lt;{email.from}&gt;
                </span>
              </div>
              <span className="text-sm text-gmail-text-secondary">
                {format(new Date(email.sentAt || email.createdAt), "PPp")}
              </span>
            </div>
            <p className="text-sm text-gmail-text-secondary mt-1">
              to {email.to.join(", ")}
            </p>
            {email.scheduledAt && (
              <p className="text-sm text-gmail-blue mt-1">
                Scheduled: {format(new Date(email.scheduledAt), "PPp")}
              </p>
            )}
          </div>
        </div>

        <div
          className="prose prose-sm max-w-none text-gmail-text"
          dangerouslySetInnerHTML={{ __html: email.body }}
        />
      </div>
    </div>
  );
}
