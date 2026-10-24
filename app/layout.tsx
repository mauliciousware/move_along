import type { Metadata } from "next";
import type { ReactNode } from "react";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/shared/config";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
