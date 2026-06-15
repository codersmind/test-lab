"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  getIdToken: () => Promise<string | null>
) {
  const token = await getIdToken();
  if (!token) throw new Error("Not authenticated");

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const res = await fetch(path, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}

export function useApi() {
  const { getIdToken } = useAuth();

  return {
    get: (path: string) => apiFetch(path, { method: "GET" }, getIdToken),
    post: (path: string, body: unknown) =>
      apiFetch(path, { method: "POST", body: JSON.stringify(body) }, getIdToken),
    patch: (path: string, body: unknown) =>
      apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }, getIdToken),
    delete: (path: string) => apiFetch(path, { method: "DELETE" }, getIdToken),
    upload: (path: string, formData: FormData) =>
      apiFetch(path, { method: "POST", body: formData }, getIdToken),
  };
}
