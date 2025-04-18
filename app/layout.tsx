"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { TranslationsProvider } from "@/components/translations-context";
import { AuthProvider } from "@/components/auth-provider";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} data-route={pathname}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TranslationsProvider>
            <AuthProvider>
              <div className="flex flex-col min-h-dvh w-full bg-background">
                <Header />
                <main className="w-full">
                  {children}
                </main>
              </div>
            </AuthProvider>
          </TranslationsProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
