"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cmsFetch, getCmsToken, setCmsToken } from "@/lib/api";
import type { CmsUser } from "@/lib/types";

interface CmsAuthValue {
  user: CmsUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isAdmin: boolean;
  isEditor: boolean;
}

const CmsAuthContext = createContext<CmsAuthValue | null>(null);

export function CmsAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CmsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const refresh = useCallback(async () => {
    const token = getCmsToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await cmsFetch<CmsUser>("/auth/me");
      setUser(res.data);
    } catch {
      setCmsToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!loading && !user && pathname !== "/cms/login") {
      router.replace("/cms/login");
    }
  }, [loading, user, pathname, router]);

  const login = async (email: string, password: string) => {
    const res = await cmsFetch<{ token: string; user: CmsUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setCmsToken(res.data.token);
    setUser(res.data.user);
    router.replace("/cms");
  };

  const logout = async () => {
    try {
      await cmsFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setCmsToken(null);
    setUser(null);
    router.replace("/cms/login");
  };

  const isAdmin = user?.role?.name === "admin";
  const isEditor = isAdmin || user?.role?.name === "editor";

  return (
    <CmsAuthContext.Provider value={{ user, loading, login, logout, refresh, isAdmin, isEditor }}>
      {children}
    </CmsAuthContext.Provider>
  );
}

export function useCmsAuth() {
  const ctx = useContext(CmsAuthContext);
  if (!ctx) throw new Error("useCmsAuth must be used inside CmsAuthProvider");
  return ctx;
}

