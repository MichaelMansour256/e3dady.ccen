/**
 * Admin authentication for the attendance section.
 *
 * The project's existing admin auth uses the server-side ADMIN_PASSWORD
 * credential. After it is verified, the server issues an HttpOnly session
 * cookie; the password is never stored in browser storage or React state.
 *
 * Nothing here replaces server-side checks: every attendance API route
 * re-validates the password on each request and the database enforces the real
 * rules (RLS + UNIQUE(meeting_id, member_id)).
 */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

export type AdminAuthStatus = "checking" | "anonymous" | "authenticated";

export interface AdminAuth {
  status: AdminAuthStatus;
  authed: boolean;
  /** Login error, ready to display (Arabic). */
  error: string | null;
  pending: boolean;
  headers: Record<string, string>;
  jsonHeaders: Record<string, string>;
  login: (candidate: string) => Promise<boolean>;
  logout: () => void;
}

export function useAdminAuth(): AdminAuth {
  const [status, setStatus] = useState<AdminAuthStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth", { cache: "no-store" })
      .then((res) => {
        setStatus(res.ok ? "authenticated" : "anonymous");
      })
      .catch(() => {
        setStatus("anonymous");
      });
  }, []);

  const login = useCallback(async (candidate: string) => {
    const value = candidate.trim();
    if (!value) {
      setError("أدخل كلمة المرور");
      return false;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "x-admin-password": value },
        cache: "no-store",
      });
      if (res.status === 401) {
        setError("كلمة المرور غير صحيحة");
        return false;
      }
      if (!res.ok) {
        setError("تعذّر التحقق من كلمة المرور. حاول مرة أخرى.");
        return false;
      }
      setStatus("authenticated");
      return true;
    } catch {
      setError("تعذّر الاتصال بالخادم");
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const logout = useCallback(() => {
    void fetch("/api/admin/auth", { method: "DELETE", cache: "no-store" });
    setStatus("anonymous");
  }, []);

  const authed = status === "authenticated";

  const headers = useMemo(() => ({}), []);
  const jsonHeaders = useMemo(
    () => ({ "content-type": "application/json" }),
    []
  );

  return { status, authed, error, pending, headers, jsonHeaders, login, logout };
}
