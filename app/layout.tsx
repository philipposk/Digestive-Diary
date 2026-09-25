import type { Metadata } from 'next';
import { Inter, Instrument_Serif, JetBrains_Mono, DM_Sans } from 'next/font/google';
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import FloatingChatButton from "@/components/chat/FloatingChatButton";
import AutoScanRunner from "@/components/AutoScanRunner";
import PWARegister from "@/components/PWARegister";
import RemindersRunner from "@/components/RemindersRunner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import SiteHeader from "@/components/ui/SiteHeader";
import SkipToContent from "@/components/ui/SkipToContent";
import ScrollProgress from "@/components/ui/ScrollProgress";
import BackToTop from "@/components/ui/BackToTop";
import CookieBanner from "@/components/ui/CookieBanner";
import { APP_SCHEMA, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  themeColor: "#f6f5f1",
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Diary",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-mode="light"
      data-vibe="clinical"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrains.variable} ${dmSans.variable} w-full`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_SCHEMA) }}
        />
      </head>
      <body className="w-full bg-deep text-ink font-body">
        <AuthProvider>
          <ConfirmProvider>
            <ThemeProvider>
              <SkipToContent />
              <ScrollProgress />
              <SiteHeader />
              <main id="main-content" className="min-h-screen pb-24 bg-app w-full">
                {children}
              </main>
              <BottomNav />
              <FloatingChatButton />
              <BackToTop />
              <CookieBanner />
              <AutoScanRunner />
              <PWARegister />
              <RemindersRunner />
            </ThemeProvider>
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
