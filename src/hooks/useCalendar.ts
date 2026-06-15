"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import type { CalendarEvent } from "@/types";

export function useCalendar(start?: string, end?: string) {
  const api = useApi();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.set("start", start);
      if (end) params.set("end", end);
      const data = await api.get(`/api/calendar?${params}`);
      setEvents(data.events);
    } finally {
      setLoading(false);
    }
  }, [api, start, end]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (
    event: Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    const data = await api.post("/api/calendar", event);
    setEvents((prev) => [...prev, data]);
    return data;
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    await api.patch(`/api/calendar/${id}`, updates);
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const removeEvent = async (id: string) => {
    await api.delete(`/api/calendar/${id}`);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return { events, loading, addEvent, updateEvent, removeEvent, refetch: fetchEvents };
}
