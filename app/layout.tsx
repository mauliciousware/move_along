import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Press_Start_2P } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME, CONFIG } from "@/lib/shared/config";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-body" });
const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel", display: "swap" });

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: CONFIG.colors.paper,
};

export const metadata: Metadata = {
  title: `${APP_NAME} — A little movement. A lot more play.`,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={`${geist.variable} ${pixel.variable}`}>
    <body>{children}</body>
  </html>;
}
