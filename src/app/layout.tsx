"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { twinPlusKernel } from "@/core/twin_plus/twin_plus_kernel";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // This initializes the Twin+ kernel on the client-side when the app starts.
    twinPlusKernel.init();
  }, []);

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white selection:bg-indigo-500/30`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
