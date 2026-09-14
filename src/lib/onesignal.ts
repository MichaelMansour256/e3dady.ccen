export async function sendNotification({
  headingAr,
  headingEn,
  messageAr,
  messageEn,
  url = "/ar",
  image,
}: {
  headingAr: string;
  headingEn: string;
  messageAr: string;
  messageEn: string;
  url?: string;
  /** Optional large image (invitation photo). Shown as big picture on Android/Chrome. */
  image?: string;
}) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!appId || !apiKey) {
    throw new Error("Missing ONESIGNAL_APP_ID / ONESIGNAL_API_KEY env vars");
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://e3dady-ccen.vercel.app";
  // `url` may be a site-relative path (/ar/events) or a full https:// URL
  // typed in the admin Notify tab ("custom" launch URL).
  const fullUrl = /^https?:\/\//i.test(url) ? url : `${siteUrl}${url}`;

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // NOTE: keep the `Basic` scheme because your key is the legacy REST API
      // key (dashboard shows "Delivered", so auth already works).
      // If you generate a *new* REST API key, OneSignal docs use `Key <key>`.
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      // "Subscribed Users" is the canonical segment for the REST API.
      // "All" is not a valid API segment and can resolve to 0 recipients
      // or test-only delivery.
      included_segments: ["Subscribed Users"],
      headings: { en: headingEn, ar: headingAr },
      contents: { en: messageEn, ar: messageAr },
      // `web_url` is the field the Web SDK service worker uses for click-through.
      // `url` is kept as well for mobile / legacy clients.
      web_url: fullUrl,
      url: fullUrl,
      chrome_web_icon: `${siteUrl}/app-icon.png`,
      chrome_icon: `${siteUrl}/app-icon.png`,
      firefox_icon: `${siteUrl}/app-icon.png`,
      // Large invitation image (Android big picture + Chrome/Firefox large icon).
      // Only included when the caller passes one (Thursday invitation cron).
      ...(image
        ? {
            big_picture: image,
            chrome_big_picture: image,
            ios_attachments: { id: image },
          }
        : {}),
    }),
  });

  const data = await res.json();
  if (!res.ok || (data as { errors?: unknown }).errors) {
    console.error("OneSignal API error:", JSON.stringify(data));
    throw new Error(`OneSignal API error: ${JSON.stringify(data)}`);
  }

  return data;
}

