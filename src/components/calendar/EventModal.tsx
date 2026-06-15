"use client";

import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { CalendarEvent } from "@/types";

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  event: CalendarEvent | null;
  onSave: (data: Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function EventModal({
  open,
  onClose,
  selectedDate,
  event,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState("#1a73e8");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setStart(event.start.slice(0, 16));
      setEnd(event.end.slice(0, 16));
      setAllDay(event.allDay);
      setLocation(event.location || "");
      setColor(event.color || "#1a73e8");
    } else if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setTitle("");
      setDescription("");
      setStart(`${dateStr}T09:00`);
      setEnd(`${dateStr}T10:00`);
      setAllDay(false);
      setLocation("");
      setColor("#1a73e8");
    }
  }, [event, selectedDate, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title,
        description,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        allDay,
        location,
        color,
        reminderMinutes: 30,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gmail-border">
          <h3 className="text-lg font-medium">
            {event ? "Edit event" : "Create event"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gmail-hover">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Add title"
            className="w-full text-xl outline-none border-b border-gmail-border pb-2"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            <label htmlFor="allDay" className="text-sm">All day</label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gmail-text-secondary">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border border-gmail-border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gmail-text-secondary">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border border-gmail-border rounded text-sm"
              />
            </div>
          </div>

          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location"
            className="w-full px-3 py-2 border border-gmail-border rounded text-sm"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description"
            rows={3}
            className="w-full px-3 py-2 border border-gmail-border rounded text-sm resize-none"
          />

          <div>
            <label className="text-xs text-gmail-text-secondary">Color</label>
            <div className="flex gap-2 mt-1">
              {["#1a73e8", "#ea4335", "#34a853", "#fbbc04", "#9c27b0"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-gmail-blue" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1 text-red-600 text-sm hover:underline"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm hover:bg-gmail-hover rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gmail-blue text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
