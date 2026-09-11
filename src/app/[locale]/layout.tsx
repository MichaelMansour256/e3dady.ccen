import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import BottomNav from "@/components/BottomNav";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "ar")) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f1f5c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="E3dady" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/appstore-images/ios/180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/appstore-images/ios/167.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/appstore-images/ios/152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/appstore-images/ios/120.png" />
        {/* Apple splash screens */}
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/appstore-images/windows/SplashScreen.scale-400.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/appstore-images/windows/SplashScreen.scale-400.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/appstore-images/windows/SplashScreen.scale-200.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/appstore-images/windows/SplashScreen.scale-200.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/appstore-images/windows/SplashScreen.scale-150.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/appstore-images/windows/SplashScreen.scale-200.png" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <main className="pb-safe min-h-dvh">{children}</main>
          <BottomNav locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
