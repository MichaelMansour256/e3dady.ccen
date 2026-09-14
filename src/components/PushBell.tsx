"use client";

import { useEffect, useState } from "react";

/**
 * Explicit push opt-in bell. Lives in the More page so users can
 * (re)subscribe on demand — survives token expiry, SW migrations, and
 * dismissed prompts without nagging.
 *
 * States:
 *  - unsupported: no Notification API (old browser / in-app webview)
 *  - blocked:    permission denied — must be fixed in browser settings
 *  - on:         subscribed (has a OneSignal subscription id)
 *  - off:        permission default or granted-but-no-subscription → tap to fix
 */
type BellState = "loading" | "unsupported" | "blocked" | "on" | "off";

export default function PushBell({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const [state, setState] = useState<BellState>("loading");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (typeof Notification === "undefined") {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("blocked");
      return;
    }
    try {
      const OneSignal = (window as any).OneSignal;
      const id = OneSignal?.User?.PushSubscription?.id;
      const optedIn = OneSignal?.User?.PushSubscription?.optedIn;
      setState(id && optedIn !== false ? "on" : "off");
    } catch {
      setState("off");
    }
  }

  useEffect(() => {
    refresh();
    // Re-check when the tab regains focus (user may have allowed in settings).
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const t = setInterval(refresh, 5000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(t);
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const prompt = window.__oneSignalPromptPush;
      if (!prompt) {
        // SDK not loaded yet — try silent repair via native request as fallback.
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
          await Notification.requestPermission();
        }
        await refresh();
        return;
      }
      const res = await prompt();
      if (res === "blocked") setState("blocked");
      else {
        // Give the SDK a moment to mint the subscription id.
        await new Promise((r) => setTimeout(r, 1500));
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const box =
    "flex items-center gap-4 rounded-2xl border border-blue-mid/40 bg-blue-primary/40 p-4 backdrop-blur-sm";

  if (state === "loading") {
    return (
      <div className={box}>
        <span className="text-2xl">🔔</span>
        <span className="text-base font-semibold text-white">
          {isAr ? "الإشعارات" : "Notifications"}
        </span>
        <span className="ms-auto text-sm text-blue-light/50">…</span>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className={box}>
        <span className="text-2xl">🔕</span>
        <div>
          <p className="text-base font-semibold text-white">
            {isAr ? "الإشعارات غير مدعومة" : "Notifications not supported"}
          </p>
          <p className="text-xs text-blue-light/60">
            {isAr
              ? "افتح الموقع في كروم أو سفاري لتفعيل الإشعارات"
              : "Open in Chrome or Safari to enable notifications"}
          </p>
        </div>
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className={`${box} border-red-400/40`}>
        <span className="text-2xl">🚫</span>
        <div>
          <p className="text-base font-semibold text-white">
            {isAr ? "الإشعارات محظورة" : "Notifications blocked"}
          </p>
          <p className="text-xs text-blue-light/60">
            {isAr
              ? "افتح ⚙️ إعدادات المتصفح ← الإشعارات ← سماح، ثم ارجع هنا"
              : "Open browser settings → Notifications → Allow, then come back"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button onClick={state === "on" ? refresh : enable} disabled={busy} className={`${box} w-full text-start active:scale-95 transition`}>
      <span className="text-2xl">{state === "on" ? "🔔" : "🔕"}</span>
      <span>
        <span className="block text-base font-semibold text-white">
          {state === "on"
            ? isAr ? "الإشعارات مفعّلة ✅" : "Notifications on ✅"
            : busy
              ? isAr ? "جاري التفعيل…" : "Enabling…"
              : isAr ? "فعّل إشعارات الاجتماع 🔔" : "Enable meeting notifications 🔔"}
        </span>
        {state !== "on" && (
          <span className="block text-xs text-blue-light/60">
            {isAr ? "اضغط للتفعيل — ستصلك الدعوة وآية الأسبوع" : "Tap to enable — get the invite & verse of the week"}
          </span>
        )}
      </span>
      <span className="ms-auto text-blue-light/50">›</span>
    </button>
  );
}
