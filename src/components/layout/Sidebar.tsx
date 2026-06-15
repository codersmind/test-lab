"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mail,
  Calendar,
  Users,
  Inbox,
  Send,
  FileText,
  Star,
  Trash2,
  Clock,
  Menu,
  X,
  PenSquare,
  Shield,
  Archive,
  Settings,
} from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useAuth } from "@/components/auth/AuthProvider";
import { useApi } from "@/hooks/useApi";

const navItems = [
  { href: "/mail", label: "Mail", icon: Mail },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/contacts", label: "Contacts", icon: Users },
];

const mailFolders = [
  { href: "/mail", folder: "inbox", label: "Inbox", icon: Inbox, countKey: "inbox" },
  { href: "/mail/starred", folder: "starred", label: "Starred", icon: Star },
  { href: "/mail/sent", folder: "sent", label: "Sent", icon: Send },
  { href: "/mail/drafts", folder: "drafts", label: "Drafts", icon: FileText, countKey: "drafts" },
  { href: "/mail/scheduled", folder: "scheduled", label: "Scheduled", icon: Clock, countKey: "scheduled" },
  { href: "/mail/archive", folder: "archive", label: "Archive", icon: Archive },
  { href: "/mail/trash", folder: "trash", label: "Trash", icon: Trash2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, openCompose, mailRefreshKey } = useUIStore();
  const { user, isAdmin } = useAuth();
  const api = useApi();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const isMail = pathname.startsWith("/mail");

  useEffect(() => {
    if (!user) return;
    api.get("/api/emails/counts").then((data) => setCounts(data.counts || {})).catch(() => {});
  }, [api, user, mailRefreshKey]);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gmail-border flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gmail-border lg:border-0">
          <Link href="/mail" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gmail-red flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl text-gmail-text font-medium">MailBox</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-gmail-hover">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isMail && (
          <div className="px-3 py-2">
            <button
              onClick={() => { openCompose(); setSidebarOpen(false); }}
              className="flex items-center gap-3 w-full px-6 py-3 bg-[#c2e7ff] hover:bg-[#a8d8f0] rounded-2xl text-gmail-text font-medium transition-colors shadow-sm"
            >
              <PenSquare className="w-5 h-5" />
              Compose
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <div className="mb-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-4 px-4 py-2 rounded-r-full text-sm font-medium transition-colors ${
                    active ? "bg-gmail-selected text-gmail-blue" : "text-gmail-text hover:bg-gmail-hover"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
            <Link
              href="/settings"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-4 px-4 py-2 rounded-r-full text-sm font-medium transition-colors ${
                pathname === "/settings" ? "bg-gmail-selected text-gmail-blue" : "text-gmail-text hover:bg-gmail-hover"
              }`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </div>

          {isMail && (
            <div>
              <p className="px-4 py-2 text-xs font-medium text-gmail-text-secondary uppercase">Folders</p>
              {mailFolders.map(({ href, label, icon: Icon, countKey }) => {
                const active = pathname === href;
                const count = countKey ? counts[countKey] : 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-4 px-4 py-2 rounded-r-full text-sm transition-colors ${
                      active ? "bg-gmail-selected text-gmail-blue font-medium" : "text-gmail-text hover:bg-gmail-hover"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{label}</span>
                    {count > 0 && (
                      <span className="text-xs font-medium text-gmail-text-secondary">{count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {isAdmin && (
            <div className="mt-4">
              <p className="px-4 py-2 text-xs font-medium text-gmail-text-secondary uppercase">Admin</p>
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-4 px-4 py-2 rounded-r-full text-sm transition-colors ${
                  pathname === "/admin" ? "bg-gmail-selected text-gmail-blue font-medium" : "text-gmail-text hover:bg-gmail-hover"
                }`}
              >
                <Shield className="w-5 h-5" />
                Manage users
              </Link>
            </div>
          )}
        </nav>

        {user && (
          <div className="p-4 border-t border-gmail-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gmail-blue text-white flex items-center justify-center text-sm font-medium">
                {(user.displayName || user.email || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user.displayName || "User"}</p>
                <p className="text-xs text-gmail-text-secondary truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  const { setSidebarOpen } = useUIStore();
  return (
    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-full hover:bg-gmail-hover">
      <Menu className="w-5 h-5" />
    </button>
  );
}
