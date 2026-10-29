import type { Metadata } from "next";
import {
  Geist_Mono,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";

import "./globals.css";

import RootClientShell from "@/components/layout/RootClientShell";

/*
 * الخط الأساسي للمنصة: IBM Plex Sans Arabic يدعم العربي والإنجليزي.
 * أثقل وزن فيه 700، فتظهر عناوين font-black عريضة بشكل هادئ.
 */
const mainFont = IBM_Plex_Sans_Arabic({
  variable: "--font-main",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Masar Makers",
  description:
    "Masar Makers is a professional learning platform for transportation engineering, BIM, and infrastructure. Build your career through real projects and expert-led learning journeys.",
  // أيقونة الشاشة الرئيسية على iPhone (أندرويد بياخدها من manifest)
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${mainFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-[#F7F8FA]">
        <RootClientShell>
          {children}
        </RootClientShell>
      </body>
    </html>
  );
}