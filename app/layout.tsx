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
        <header className="border-b border-rule px-6 py-5 flex items-end justify-between gap-6">
          <div className="flex flex-col">
            <Link
              href="/"
              className="font-serif text-3xl leading-none tracking-tight"
            >
              Clarity
              <span className="relative">
                NUS
                <span
                  aria-hidden
                  className="absolute left-0 right-0 -bottom-1 h-[3px] bg-accent rounded-full"
                />
              </span>
            </Link>
            <p className="mt-1 text-sm italic font-serif text-muted">
              Bite-sized clarity, crowd-sourced understanding.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/clarities/new"
              className="text-sm font-medium underline underline-offset-4 decoration-accent decoration-2 hover:text-accent"
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