import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import FloatingChatButton from "@/components/chat/FloatingChatButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Digestive Diary",
  description: "A non-judgmental tracking app for digestive disorders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="w-full">
      <body className={`${inter.className} w-full`}>
        <ThemeProvider>
          <main className="min-h-screen pb-20 bg-white dark:bg-gray-950 w-full">
            {children}
          </main>
                <BottomNav />
                <FloatingChatButton />
              </ThemeProvider>
            </body>
          </html>
        );
      }

