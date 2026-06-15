"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import type { Email, MailFolder } from "@/types";

export function useEmails(folder: MailFolder) {
  const api = useApi();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/emails?folder=${folder}`);
      setEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [api, folder]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

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

  return { emails, loading, error, refetch: fetchEmails, updateEmail, deleteEmail };
}
