import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import AuthStatus from "./components/AuthStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "ClarityNUS",
  description: "Bite-sized clarity, crowd-sourced understanding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-rule px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid place-items-center w-8 h-8 rounded-lg bg-foreground text-background font-serif text-base leading-none"
            >
              C
            </span>
            <span className="font-serif text-2xl leading-none tracking-tight text-foreground">
              ClarityNUS
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/clarities/new"
              className="rounded-lg bg-foreground text-background px-3.5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              New clarity
            </Link>
            <AuthStatus />
          </div>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}