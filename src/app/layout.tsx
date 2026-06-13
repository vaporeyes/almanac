// ABOUTME: Root layout for the almanac weather application
// ABOUTME: Loads global styles and the local display font variable

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const web437ApricotMono = localFont({
  src: "./fonts/Web437_Apricot_Mono.woff",
  variable: "--font-web437",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Farmer's Almanac Weather",
  description: "Retro ASCII weather almanac with real-time conditions and historical climate data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${web437ApricotMono.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  );
}
