"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, UserCheck, UserX, KeyRound } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import toast from "react-hot-toast";

interface ProvisionedUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const allowedDomain =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "mydomain.com";

export function UsersManager() {
  const api = useApi();
  const [users, setUsers] = useState<ProvisionedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "user",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/admin/users");
      setUsers(data.users);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/users", form);
      toast.success(`Account created for ${form.email}`);
      setForm({ email: "", password: "", displayName: "", role: "user" });
      setFormOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  const toggleActive = async (user: ProvisionedUser) => {
    try {
      await api.patch(`/api/admin/users/${user.uid}`, {
        active: !user.active,
      });
      toast.success(user.active ? "User disabled" : "User enabled");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const resetPassword = async (user: ProvisionedUser) => {
    const password = prompt(`New password for ${user.email}:`);
    if (!password) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await api.patch(`/api/admin/users/${user.uid}`, { password });
      toast.success("Password updated. Share it with the user.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password reset failed");
    }
  };

  const deleteUser = async (user: ProvisionedUser) => {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/users/${user.uid}`);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gmail-border">
        <div>
          <h2 className="text-xl font-normal">User accounts</h2>
          <p className="text-sm text-gmail-text-secondary mt-1">
            Create accounts on @{allowedDomain} and share login details with users
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gmail-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create account</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-gmail-blue border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gmail-bg text-left text-gmail-text-secondary">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-b border-gmail-border/50 hover:bg-gmail-hover">
                  <td className="px-6 py-4">
                    <p className="font-medium">{user.displayName}</p>
                    <p className="sm:hidden text-gmail-text-secondary text-xs">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">{user.email}</td>
                  <td className="px-6 py-4 hidden md:table-cell capitalize">{user.role}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => resetPassword(user)}
                        className="p-2 rounded-full hover:bg-white"
                        title="Reset password"
                      >
                        <KeyRound className="w-4 h-4 text-gmail-text-secondary" />
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        className="p-2 rounded-full hover:bg-white"
                        title={user.active ? "Disable" : "Enable"}
                      >
                        {user.active ? (
                          <UserX className="w-4 h-4 text-gmail-text-secondary" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-gmail-text-secondary" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        className="p-2 rounded-full hover:bg-white"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-gmail-text-secondary" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gmail-border">
              <h3 className="text-lg font-medium">Create user account</h3>
              <p className="text-sm text-gmail-text-secondary mt-1">
                Share the email and password with the user so they can sign in
              </p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Display name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gmail-border rounded text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="flex mt-1">
                  <input
                    type="text"
                    value={form.email.replace(`@${allowedDomain}`, "")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: `${e.target.value.replace("@", "")}@${allowedDomain}`,
                      })
                    }
                    required
                    className="flex-1 px-3 py-2 border border-gmail-border rounded-l text-sm"
                    placeholder="someone"
                  />
                  <span className="px-3 py-2 bg-gmail-bg border border-l-0 border-gmail-border rounded-r text-sm text-gmail-text-secondary">
                    @{allowedDomain}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full mt-1 px-3 py-2 border border-gmail-border rounded text-sm"
                  placeholder="Share this with the user"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gmail-border rounded text-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
                  Create & share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
