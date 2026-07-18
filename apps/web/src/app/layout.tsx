import { Figtree, Syne } from "next/font/google";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { themeInitScript } from "@/components/theme-toggle";
import { DailyLoginPopup } from "@/components/daily-login-popup";
import { getSession } from "@/lib/session";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Inkday — Daily puzzles",
  description:
    "Play today’s Word Daily, Escape Room, Logic Grid, and word puzzles. Track streaks and challenge friends.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className={`${display.variable} ${body.variable} dark h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="relative flex min-h-full flex-col antialiased">
        <SiteHeader />
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
        <footer className="relative z-10 border-t border-[var(--line)] px-4 py-6 text-center text-xs text-fog">
          Inkday · shared puzzle core ready for a future mobile app
        </footer>
        <DailyLoginPopup signedIn={Boolean(session?.user)} />
      </body>
    </html>
  );
}
