import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            ClarityNUS
          </Link>
          <Link
            href="/clarities/new"
            className="text-sm underline underline-offset-4"
          >
            New clarity
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
