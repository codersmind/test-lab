"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { requestFCMToken } from "@/lib/fcm/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function saveFCMToken(user: User) {
  const token = await requestFCMToken();
  if (!token) return;

  const idToken = await user.getIdToken();
  await fetch("/api/notifications/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fcmToken: token }),
  });
}

async function verifyProvisionedUser(user: User): Promise<{ ok: boolean; isAdmin: boolean; error?: string }> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return {
      ok: false,
      isAdmin: false,
      error: data.error || "Account not authorized",
    };
  }

  const data = await res.json();
  return { ok: true, isAdmin: data.isAdmin === true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const verification = await verifyProvisionedUser(firebaseUser);
      if (!verification.ok) {
        await signOut(auth);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setIsAdmin(verification.isAdmin);
      setLoading(false);
      saveFCMToken(firebaseUser).catch(() => {});
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase is not configured");

    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const verification = await verifyProvisionedUser(cred.user);

    if (!verification.ok) {
      await signOut(auth);
      throw new Error(
        verification.error ||
          "This account was not created by an admin. Contact your administrator."
      );
    }

    setUser(cred.user);
    setIsAdmin(verification.isAdmin);
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
  };

  const getIdToken = async () => {
    if (!user) return null;
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, configured, isAdmin, login, logout, getIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
