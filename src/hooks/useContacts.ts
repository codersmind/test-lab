"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import type { Contact } from "@/types";

export function useContacts() {
  const api = useApi();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/contacts");
      setContacts(data.contacts);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (contact: Omit<Contact, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const data = await api.post("/api/contacts", contact);
    setContacts((prev) => [...prev, data]);
    return data;
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    await api.patch(`/api/contacts/${id}`, updates);
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const removeContact = async (id: string) => {
    await api.delete(`/api/contacts/${id}`);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return { contacts, loading, addContact, updateContact, removeContact, refetch: fetchContacts };
}
