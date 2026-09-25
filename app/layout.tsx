import type { Metadata } from 'next';
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import FloatingChatButton from "@/components/chat/FloatingChatButton";
import AutoScanRunner from "@/components/AutoScanRunner";
import PWARegister from "@/components/PWARegister";
import RemindersRunner from "@/components/RemindersRunner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import SyncProvider from "@/components/SyncProvider";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";
import SiteHeader from "@/components/ui/SiteHeader";
import SkipToContent from "@/components/ui/SkipToContent";
import ScrollProgress from "@/components/ui/ScrollProgress";
import BackToTop from "@/components/ui/BackToTop";
import CookieBanner from "@/components/ui/CookieBanner";
import { APP_SCHEMA, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

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
      className="w-full"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_SCHEMA) }}
        />
      </head>
      <body className="w-full bg-deep text-ink font-body">
        <AuthProvider>
          <ConfirmProvider>
            <ThemeProvider>
              <SyncProvider>
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
              </SyncProvider>
            </ThemeProvider>
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
