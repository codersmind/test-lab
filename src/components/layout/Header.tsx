"use client";

import { useRouter } from "next/navigation";
import { Search, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUIStore } from "@/store/ui-store";
import { MobileMenuButton } from "./Sidebar";

export function Header({ title }: { title?: string }) {
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useUIStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gmail-border min-h-[56px]">
      <MobileMenuButton />

      {title && (
        <h1 className="text-lg font-normal text-gmail-text hidden sm:block min-w-[120px]">
          {title}
        </h1>
      )}

      <div className="flex-1 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gmail-text-secondary" />
          <input
            type="search"
            placeholder="Search mail"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gmail-bg rounded-full border-none outline-none focus:ring-2 focus:ring-gmail-blue/30 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-2 rounded-full hover:bg-gmail-hover hidden sm:block">
          <Settings className="w-5 h-5 text-gmail-text-secondary" />
        </button>
        {user && (
          <>
            <div className="w-8 h-8 rounded-full bg-gmail-blue text-white flex items-center justify-center text-sm font-medium sm:hidden">
              {(user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gmail-hover"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-gmail-text-secondary" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
