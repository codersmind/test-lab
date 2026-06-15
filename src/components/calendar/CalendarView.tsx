"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCalendar } from "@/hooks/useCalendar";
import { EventModal } from "./EventModal";
import type { CalendarEvent } from "@/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const { events, addEvent, updateEvent, removeEvent } = useCalendar(
    calStart.toISOString(),
    calEnd.toISOString()
  );

  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.start), day));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setEditingEvent(null);
    setEventModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setEventModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gmail-border">
        <div className="flex items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-normal">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 rounded-full hover:bg-gmail-hover"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm border border-gmail-border rounded hover:bg-gmail-hover"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-full hover:bg-gmail-hover"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedDate(new Date());
            setEditingEvent(null);
            setEventModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gmail-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-px bg-gmail-border border border-gmail-border rounded-lg overflow-hidden min-h-[500px]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="bg-gmail-bg text-center py-2 text-xs font-medium text-gmail-text-secondary"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day[0]}</span>
            </div>
          ))}

          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const inMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`bg-white min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 cursor-pointer hover:bg-gmail-bg transition-colors ${
                  !inMonth ? "opacity-40" : ""
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                    isToday(day)
                      ? "bg-gmail-blue text-white"
                      : "text-gmail-text"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(event, e)}
                      className="text-xs px-1.5 py-0.5 rounded truncate text-white"
                      style={{ backgroundColor: event.color || "#1a73e8" }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gmail-text-secondary px-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EventModal
        open={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setEditingEvent(null);
        }}
        selectedDate={selectedDate}
        event={editingEvent}
        onSave={async (data) => {
          if (editingEvent) {
            await updateEvent(editingEvent.id, data);
          } else {
            await addEvent(data);
          }
          setEventModalOpen(false);
        }}
        onDelete={
          editingEvent
            ? async () => {
                await removeEvent(editingEvent.id);
                setEventModalOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}
