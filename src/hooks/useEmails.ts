"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { useUIStore } from "@/store/ui-store";
import type { Email, MailFolder } from "@/types";

export function useEmails(folder: MailFolder) {
  const api = useApi();
  const { searchQuery, mailRefreshKey } = useUIStore();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = useCallback(async (append = false, cursor?: string | null) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      } else {
        params.set("folder", folder);
        if (cursor) params.set("cursor", cursor);
      }

      const data = await api.get(`/api/emails?${params}`);
      setEmails((prev) => (append ? [...prev, ...data.emails] : data.emails));
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [api, folder, searchQuery]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails, mailRefreshKey]);

  const loadMore = () => {
    if (nextCursor && !loadingMore) fetchEmails(true, nextCursor);
  };

  const updateEmail = async (id: string, updates: Partial<Email>) => {
    await api.patch(`/api/emails/${id}`, updates);
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteEmail = async (id: string) => {
    await api.delete(`/api/emails/${id}`);
    setEmails((prev) => prev.filter((e) => e.id !== id));
  };

  const archiveEmail = async (id: string) => {
    await updateEmail(id, { folder: "archive", read: true });
    setEmails((prev) => prev.filter((e) => e.id !== id));
  };

  return {
    emails,
    loading,
    loadingMore,
    error,
    hasMore: Boolean(nextCursor),
    refetch: () => fetchEmails(),
    loadMore,
    updateEmail,
    deleteEmail,
    archiveEmail,
  };
}
