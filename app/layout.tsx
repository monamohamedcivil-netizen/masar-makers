import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import {
  BuilderModeBar,
  BuilderPropertiesPanel,
  BuilderProvider,
} from "@/components/builder";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Masar Makers",
  description:
    "Masar Makers is a professional learning platform for transportation engineering, BIM, and infrastructure. Build your career through real projects and expert-led learning journeys.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-[#F7F8FA]">
        <BuilderProvider>
          {children}

           <BuilderPropertiesPanel />

  <BuilderModeBar />
</BuilderProvider>
      </body>
    </html>
  );
}