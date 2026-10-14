/**
 * Shell for every /admin/attendance/* screen: page header, admin actions and
 * the attendance navigation, inside the project's existing page gradient.
 *
 * `children` only renders for authenticated admins (AdminAuthProvider gates it).
 */
"use client";
import Link from "next/link";
import { useAttendanceApi } from "./AdminAuthProvider";
import AttendanceNav from "./AttendanceNav";
import { subtleBtn } from "./ui";
import { Icon } from "@/components/Icon";

export default function AttendanceShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAttendanceApi();

  return (
    <div className="min-h-dvh px-3 py-5 page-gradient sm:px-4 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
              <Icon name="calendar" size={24} />
              نظام الحضور
            </h1>
            <p className="text-xs text-blue-light/50">QR Code Attendance</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className={subtleBtn}>
              <Icon name="menu" size={18} /> لوحة الإدارة
            </Link>
            <button type="button" onClick={logout} className={subtleBtn}>
              خروج
            </button>
          </div>
        </header>

        <div className="print:hidden">
          <AttendanceNav />
        </div>
        {children}
      </div>
    </div>
  );
}
