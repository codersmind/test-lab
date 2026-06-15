"use client";

import { ArrowLeft, Star, Trash2, Reply, ReplyAll, Forward, Archive, Paperclip, Download } from "lucide-react";
import { format } from "date-fns";
import type { Email, EmailAttachment } from "@/types";
import { useUIStore } from "@/store/ui-store";
import { useAuth } from "@/components/auth/AuthProvider";
import { buildReplyCompose, buildForwardCompose } from "@/lib/email/compose-helpers";
import { sanitizeEmailHtml } from "@/lib/email/sanitize";
import toast from "react-hot-toast";

interface MailDetailProps {
  email: Email | null;
  onBack: () => void;
  onStar: (starred: boolean) => void;
  onDelete: () => void;
  onArchive?: () => void;
}

export function MailDetail({ email, onBack, onStar, onDelete, onArchive }: MailDetailProps) {
  const { openCompose } = useUIStore();
  const { user, getIdToken } = useAuth();

  if (!email) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full text-gmail-text-secondary bg-white">
        <p>Select a message to read</p>
      </div>
    );
  }

  const userEmail = user?.email || "";

  const handleReply = (mode: "reply" | "reply-all") => {
    const compose = buildReplyCompose(email, userEmail, mode);
    openCompose({
      mode,
      to: compose.to,
      cc: compose.cc,
      subject: compose.subject,
      body: compose.body,
      threadId: compose.threadId,
      inReplyTo: compose.inReplyTo,
      references: compose.references,
    });
  };

  const handleForward = () => {
    const compose = buildForwardCompose(email);
    openCompose({
      mode: "forward",
      to: compose.to,
      subject: compose.subject,
      body: compose.body,
    });
  };

  const handleDownload = async (att: EmailAttachment) => {
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch(
        `/api/attachments/download?emailId=${email.id}&attachmentId=${att.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download attachment");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-1 px-2 sm:px-4 py-2 border-b border-gmail-border">
        <button onClick={onBack} className="lg:hidden p-2 rounded-full hover:bg-gmail-hover">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => onStar(!email.starred)} className="p-2 rounded-full hover:bg-gmail-hover">
          <Star className={`w-5 h-5 ${email.starred ? "fill-yellow-400 text-yellow-400" : "text-gmail-text-secondary"}`} />
        </button>
        {onArchive && email.folder === "inbox" && (
          <button onClick={onArchive} className="p-2 rounded-full hover:bg-gmail-hover" title="Archive">
            <Archive className="w-5 h-5 text-gmail-text-secondary" />
          </button>
        )}
        <button onClick={onDelete} className="p-2 rounded-full hover:bg-gmail-hover">
          <Trash2 className="w-5 h-5 text-gmail-text-secondary" />
        </button>
        <div className="flex-1" />
        <button onClick={() => handleReply("reply")} className="p-2 rounded-full hover:bg-gmail-hover" title="Reply">
          <Reply className="w-5 h-5 text-gmail-text-secondary" />
        </button>
        <button onClick={() => handleReply("reply-all")} className="p-2 rounded-full hover:bg-gmail-hover" title="Reply all">
          <ReplyAll className="w-5 h-5 text-gmail-text-secondary" />
        </button>
        <button onClick={handleForward} className="p-2 rounded-full hover:bg-gmail-hover" title="Forward">
          <Forward className="w-5 h-5 text-gmail-text-secondary" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-normal mb-4">{email.subject}</h1>

        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gmail-blue text-white flex items-center justify-center font-medium flex-shrink-0">
            {(email.fromName || email.from)[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-medium">{email.fromName || email.from}</span>
                <span className="text-gmail-text-secondary text-sm ml-2">&lt;{email.from}&gt;</span>
              </div>
              <span className="text-sm text-gmail-text-secondary">
                {format(new Date(email.sentAt || email.createdAt), "PPp")}
              </span>
            </div>
            <p className="text-sm text-gmail-text-secondary mt-1">to {email.to.join(", ")}</p>
            {email.cc && email.cc.length > 0 && (
              <p className="text-sm text-gmail-text-secondary">cc {email.cc.join(", ")}</p>
            )}
          </div>
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {email.attachments.map((att) => (
              <button
                key={att.id}
                onClick={() => handleDownload(att)}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gmail-border rounded-lg text-sm hover:bg-gmail-hover"
              >
                <Paperclip className="w-4 h-4 text-gmail-text-secondary" />
                <span>{att.filename}</span>
                <span className="text-xs text-gmail-text-secondary">
                  ({Math.round(att.size / 1024)} KB)
                </span>
                <Download className="w-4 h-4 text-gmail-blue" />
              </button>
            ))}
          </div>
        )}

        <div
          className="prose prose-sm max-w-none text-gmail-text break-words"
          dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.body) }}
        />
      </div>
    </div>
  );
}
