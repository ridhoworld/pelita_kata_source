"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  FolderTree,
  Tags,
  FileCode2,
  Users,
  Settings,
  Inbox,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useCmsAuth } from "./CmsAuthContext";

export default function CmsShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, isAdmin, isEditor } = useCmsAuth();
  const pathname = usePathname();

  if (pathname === "/cms/login") {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-muted)]">
        Memuat ruang redaksi...
      </div>
    );
  }

  const navItems = [
    { href: "/cms", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/cms/artikel", label: "Artikel", icon: FileText, show: true },
    { href: "/cms/media", label: "Pustaka Media", icon: ImageIcon, show: true },
    { href: "/cms/kategori", label: "Kategori", icon: FolderTree, show: isEditor },
    { href: "/cms/tag", label: "Tag", icon: Tags, show: isEditor },
    { href: "/cms/pesan", label: "Pesan & Hak Jawab", icon: Inbox, show: isEditor },
    { href: "/cms/halaman", label: "Halaman Statis", icon: FileCode2, show: isAdmin },
    { href: "/cms/pengguna", label: "Pengguna & Role", icon: Users, show: isAdmin },
    { href: "/cms/pengaturan", label: "Pengaturan & Log", icon: Settings, show: isAdmin },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--paper)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--surface)] flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <Link href="/cms" className="font-editorial text-xl font-bold text-[var(--ink)]">
              Pelita Kata
            </Link>
            <div className="text-[11px] uppercase tracking-wider text-[var(--accent)] font-semibold">
              CMS Redaksi
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            title="Lihat situs publik"
            className="p-1.5 rounded border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-x-auto md:overflow-visible flex md:block gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/cms"
                ? pathname === "/cms"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--ink)] hover:bg-[var(--paper)]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <div className="font-semibold text-[var(--ink)] truncate">{user.name}</div>
            <div className="text-[var(--ink-muted)] uppercase tracking-wider text-[10px]">
              {user.role?.name}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Keluar"
            className="p-2 rounded border border-[var(--border)] hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

