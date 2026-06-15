"use client";

import { useState } from "react";
import { Plus, Search, Mail, Phone, Building, Trash2, Edit2 } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { useUIStore } from "@/store/ui-store";
import type { Contact } from "@/types";

export function ContactsView() {
  const { contacts, loading, addContact, updateContact, removeContact } = useContacts();
  const { setComposeOpen } = useUIStore();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openForm = (contact?: Contact) => {
    if (contact) {
      setEditing(contact);
      setForm({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || "",
        company: contact.company || "",
        notes: contact.notes || "",
      });
    } else {
      setEditing(null);
      setForm({ name: "", email: "", phone: "", company: "", notes: "" });
    }
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateContact(editing.id, form);
    } else {
      await addContact(form);
    }
    setFormOpen(false);
  };

  const grouped = filtered.reduce<Record<string, Contact[]>>((acc, contact) => {
    const letter = contact.name[0]?.toUpperCase() || "#";
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gmail-border gap-4">
        <h2 className="text-xl font-normal">Contacts</h2>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gmail-text-secondary" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts"
              className="w-full pl-9 pr-4 py-2 bg-gmail-bg rounded-full text-sm outline-none"
            />
          </div>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-1 px-4 py-2 bg-gmail-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-gmail-blue border-t-transparent rounded-full" />
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-12 text-gmail-text-secondary">
            <p>No contacts yet</p>
            <button
              onClick={() => openForm()}
              className="mt-4 text-gmail-blue hover:underline text-sm"
            >
              Add your first contact
            </button>
          </div>
        ) : (
          Object.keys(grouped)
            .sort()
            .map((letter) => (
              <div key={letter}>
                <div className="sticky top-0 bg-gmail-bg px-6 py-1 text-sm font-medium text-gmail-text-secondary">
                  {letter}
                </div>
                {grouped[letter].map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-4 px-4 sm:px-6 py-3 hover:bg-gmail-hover group border-b border-gmail-border/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-gmail-blue text-white flex items-center justify-center font-medium flex-shrink-0">
                      {contact.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-sm text-gmail-text-secondary truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </p>
                      {contact.phone && (
                        <p className="text-sm text-gmail-text-secondary flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </p>
                      )}
                      {contact.company && (
                        <p className="text-sm text-gmail-text-secondary flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {contact.company}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setComposeOpen(true);
                        }}
                        className="p-2 rounded-full hover:bg-white"
                        title="Send email"
                      >
                        <Mail className="w-4 h-4 text-gmail-text-secondary" />
                      </button>
                      <button
                        onClick={() => openForm(contact)}
                        className="p-2 rounded-full hover:bg-white"
                      >
                        <Edit2 className="w-4 h-4 text-gmail-text-secondary" />
                      </button>
                      <button
                        onClick={() => removeContact(contact.id)}
                        className="p-2 rounded-full hover:bg-white"
                      >
                        <Trash2 className="w-4 h-4 text-gmail-text-secondary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gmail-border">
              <h3 className="text-lg font-medium">
                {editing ? "Edit contact" : "New contact"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Name"
                className="w-full px-3 py-2 border border-gmail-border rounded text-sm"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="Email"
                className="w-full px-3 py-2 border border-gmail-border rounded text-sm"
              />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone"
                className="w-full px-3 py-2 border border-gmail-border rounded text-sm"
              />
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company"
                className="w-full px-3 py-2 border border-gmail-border rounded text-sm"
              />
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes"
                rows={2}
                className="w-full px-3 py-2 border border-gmail-border rounded text-sm resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-sm hover:bg-gmail-hover rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gmail-blue text-white rounded text-sm font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
