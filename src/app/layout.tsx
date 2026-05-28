import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Mood Journal",
  description: "Log your mood and a short reflection each day.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-foreground`}>
        <div className="mx-auto min-h-dvh w-full max-w-[390px]">{children}</div>
      </body>
    </html>
  );
}
