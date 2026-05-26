import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import FloatingChatButton from "@/components/chat/FloatingChatButton";
import AutoScanRunner from "@/components/AutoScanRunner";
import PWARegister from "@/components/PWARegister";
import RemindersRunner from "@/components/RemindersRunner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist", // alias kept so globals.css doesn't need a rename
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
  title: "Digestive Diary",
  description: "A non-judgmental tracking app for digestive disorders",
  manifest: "/manifest.webmanifest",
  themeColor: "#f6f5f1",
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
      <body className="w-full bg-deep text-ink font-body">
        <ThemeProvider>
          <main className="min-h-screen pb-24 bg-app w-full">
            {children}
          </main>
          <BottomNav />
          <FloatingChatButton />
          <AutoScanRunner />
          <PWARegister />
          <RemindersRunner />
        </ThemeProvider>
      </body>
    </html>
  );
}
