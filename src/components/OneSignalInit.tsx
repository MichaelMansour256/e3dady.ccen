"use client";

import Script from "next/script";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    __oneSignalInitialized?: boolean;
  }
}

/**
 * Loads the OneSignal Web SDK (v16) and initializes it exactly once.
 * Rendered from the locale layout. Uses next/script so the SDK file is
 * guaranteed loaded before init runs (the old inline <head> snippet could
 * race the deferred SDK and silently never initialize).
 */
export default function OneSignalInit() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  if (!appId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[OneSignal] NEXT_PUBLIC_ONESIGNAL_APP_ID is missing — push init skipped.");
    }
    return null;
  }

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="lazyOnload"
      onLoad={() => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function (OneSignal) {
          // Guard against double-init when navigating between /ar and /en
          // (each locale layout mounts this component).
          if (window.__oneSignalInitialized) return;
          window.__oneSignalInitialized = true;
          try {
            await OneSignal.init({
              appId,
              notifyButton: { enable: false },
              // Must match the v16 stub files in /public (root scope).
              serviceWorkerPath: "/OneSignalSDKWorker.js",
              serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
              allowLocalhost: process.env.NODE_ENV !== "production",
              autoResubscribe: true,
              promptOptions: {
                slidedown: {
                  prompts: [
                    {
                      type: "push",
                      autoPrompt: true,
                      text: {
                        actionMessage:
                          "اشترك في الإشعارات لتصلك تذكيرات الاجتماع وآية الأسبوع",
                        acceptButton: "اشترك",
                        cancelButton: "لاحقاً",
                      },
                      delay: { pageViews: 1, timeDelay: 5 },
                    },
                  ],
                },
              },
            });
            console.log("OneSignal initialized successfully");
          } catch (error) {
            window.__oneSignalInitialized = false;
            console.error("OneSignal initialization error:", error);
          }
        });
      }}
    />
  );
}
