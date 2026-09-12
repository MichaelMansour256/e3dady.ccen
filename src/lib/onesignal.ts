export async function sendNotification({
  headingAr,
  headingEn,
  messageAr,
  messageEn,
  url = "/",
}: {
  headingAr: string;
  headingEn: string;
  messageAr: string;
  messageEn: string;
  url?: string;
}) {
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      included_segments: ["All"],
      headings: { ar: headingAr, en: headingEn },
      contents: { ar: messageAr, en: messageEn },
      url: `https://e3dady-ccen.vercel.app${url}`,
      chrome_web_icon: "https://e3dady-ccen.vercel.app/appstore-images/android/launchericon-192x192.png",
    }),
  });

  return res.json();
}
