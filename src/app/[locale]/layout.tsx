import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import BottomNav from "@/components/BottomNav";
import { Cairo, Inter } from "next/font/google";

const cairo = Cairo({ subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--font-cairo", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-inter", display: "swap" });

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
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}
      className={locale === "ar" ? cairo.variable : inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f1f5c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="E3dady" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/app-icon.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/app-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/app-icon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/app-icon.png" />
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
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script dangerouslySetInnerHTML={{ __html: `
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}",
              notifyButton: { enable: false },
              promptOptions: {
                slidedown: {
                  prompts: [{
                    type: "push",
                    autoPrompt: true,
                    text: {
                      actionMessage: "اشترك في الإشعارات لتصلك تذكيرات الاجتماع وآية الأسبوع",
                      acceptButton: "اشترك",
                      cancelButton: "لاحقاً"
                    },
                    delay: { pageViews: 1, timeDelay: 5 }
                  }]
                }
              }
            });
          });
        `}} />
      </body>
    </html>
  );
}
