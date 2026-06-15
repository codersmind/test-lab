"use client";

import { useState, useEffect } from "react";
import {
  X,
  Minus,
  Maximize2,
  Send,
  Clock,
  Paperclip,
  ChevronDown,
} from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useApi } from "@/hooks/useApi";
import { useContacts } from "@/hooks/useContacts";
import toast from "react-hot-toast";
import { format } from "date-fns";

export function ComposeModal() {
  const { composeOpen, setComposeOpen } = useUIStore();
  const api = useApi();
  const { contacts } = useContacts();
  const [minimized, setMinimized] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof contacts>([]);

  useEffect(() => {
    if (!composeOpen) {
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setBody("");
      setScheduledAt("");
      setShowCc(false);
      setShowSchedule(false);
      setMinimized(false);
    }
  }, [composeOpen]);

  if (!composeOpen) return null;

  const parseEmails = (str: string) =>
    str
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

  const handleToChange = (value: string) => {
    setTo(value);
    const last = value.split(",").pop()?.trim() || "";
    if (last.length > 0) {
      setSuggestions(
        contacts.filter(
          (c) =>
            c.email.toLowerCase().includes(last.toLowerCase()) ||
            c.name.toLowerCase().includes(last.toLowerCase())
        )
      );
    } else {
      setSuggestions([]);
    }
  };

  const selectContact = (email: string) => {
    const parts = to.split(",");
    parts[parts.length - 1] = ` ${email}`;
    setTo(parts.join(",").trim() + ", ");
    setSuggestions([]);
  };

  const handleSend = async () => {
    const toList = parseEmails(to);
    if (!toList.length) {
      toast.error("Please add at least one recipient");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please add a subject");
      return;
    }

    setSending(true);
    try {
      const payload = {
        to: toList,
        cc: parseEmails(cc),
        bcc: parseEmails(bcc),
        subject,
        body: body.replace(/\n/g, "<br>"),
        scheduledAt: scheduledAt || undefined,
      };

      const result = await api.post("/api/emails", payload);
      if (result.scheduled) {
        toast.success(`Email scheduled for ${format(new Date(scheduledAt), "PPp")}`);
      } else {
        toast.success("Email sent!");
      }
      setComposeOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await api.post("/api/emails/draft", {
        to: parseEmails(to),
        cc: parseEmails(cc),
        bcc: parseEmails(bcc),
        subject,
        body,
      });
      toast.success("Draft saved");
      setComposeOpen(false);
    } catch {
      toast.error("Failed to save draft");
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-0 right-4 z-50 w-72 bg-[#404040] text-white rounded-t-lg compose-shadow cursor-pointer">
        <div
          className="flex items-center justify-between px-4 py-3"
          onClick={() => setMinimized(false)}
        >
          <span className="text-sm font-medium truncate">New Message</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMinimized(false);
              }}
              className="p-1 hover:bg-white/10 rounded"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setComposeOpen(false);
              }}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:right-4 z-50 w-full sm:w-[560px] bg-white rounded-t-xl sm:rounded-t-lg compose-shadow flex flex-col max-h-[90vh] sm:max-h-[600px]">
      <div className="flex items-center justify-between px-4 py-3 bg-[#404040] text-white rounded-t-xl sm:rounded-t-lg">
        <span className="text-sm font-medium">New Message</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1 hover:bg-white/10 rounded hidden sm:block"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setComposeOpen(false)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative border-b border-gmail-border">
          <div className="flex items-center px-4 py-2">
            <span className="text-sm text-gmail-text-secondary w-12">To</span>
            <input
              type="text"
              value={to}
              onChange={(e) => handleToChange(e.target.value)}
              className="flex-1 outline-none text-sm"
              placeholder="Recipients"
            />
            {!showCc && (
              <button
                onClick={() => setShowCc(true)}
                className="text-xs text-gmail-text-secondary hover:text-gmail-text"
              >
                Cc/Bcc
              </button>
            )}
          </div>
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-white border border-gmail-border shadow-lg z-10 max-h-40 overflow-y-auto">
              {suggestions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectContact(c.email)}
                  className="w-full text-left px-4 py-2 hover:bg-gmail-hover text-sm"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gmail-text-secondary ml-2">{c.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {showCc && (
          <>
            <div className="flex items-center px-4 py-2 border-b border-gmail-border">
              <span className="text-sm text-gmail-text-secondary w-12">Cc</span>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="flex-1 outline-none text-sm"
              />
            </div>
            <div className="flex items-center px-4 py-2 border-b border-gmail-border">
              <span className="text-sm text-gmail-text-secondary w-12">Bcc</span>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="flex-1 outline-none text-sm"
              />
            </div>
          </>
        )}

        <div className="flex items-center px-4 py-2 border-b border-gmail-border">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 outline-none text-sm"
            placeholder="Subject"
          />
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full px-4 py-3 outline-none text-sm resize-none min-h-[200px]"
          placeholder="Write your message..."
        />

        {showSchedule && (
          <div className="px-4 py-2 border-t border-gmail-border bg-gmail-bg">
            <label className="text-xs text-gmail-text-secondary block mb-1">
              Schedule send
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gmail-border rounded text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gmail-border">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-6 py-2 bg-[#0b57d0] text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {scheduledAt ? "Schedule" : "Send"}
          </button>
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className={`p-2 rounded-full hover:bg-gmail-hover ${showSchedule ? "bg-gmail-selected" : ""}`}
            title="Schedule send"
          >
            <Clock className="w-5 h-5 text-gmail-text-secondary" />
          </button>
          <button className="p-2 rounded-full hover:bg-gmail-hover">
            <Paperclip className="w-5 h-5 text-gmail-text-secondary" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            className="text-sm text-gmail-text-secondary hover:text-gmail-text"
          >
            Save draft
          </button>
          <button
            onClick={() => setComposeOpen(false)}
            className="p-2 rounded-full hover:bg-gmail-hover"
          >
            <ChevronDown className="w-5 h-5 text-gmail-text-secondary" />
          </button>
        </div>
      </div>
    </div>
  );
}
