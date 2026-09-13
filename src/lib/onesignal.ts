export async function sendNotification({
  headingAr,
  headingEn,
  messageAr,
  messageEn,
  url = "/ar",
}: {
  headingAr: string;
  headingEn: string;
  messageAr: string;
  messageEn: string;
  url?: string;
}) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!appId || !apiKey) {
    throw new Error("Missing ONESIGNAL_APP_ID / ONESIGNAL_API_KEY env vars");
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://e3dady-ccen.vercel.app";
  const fullUrl = `${siteUrl}${url}`;

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
    }),
  });

  const data = await res.json();
  if (!res.ok || (data as { errors?: unknown }).errors) {
    console.error("OneSignal API error:", JSON.stringify(data));
    throw new Error(`OneSignal API error: ${JSON.stringify(data)}`);
  }

  return data;
}

