import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AuthGate } from "@/components/AuthGate";
import { DesktopSidebar } from "@/components/DesktopSidebar";
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
        <AuthGate>
          <div className="md:flex md:min-h-dvh">
            <DesktopSidebar />
            <div className="mx-auto min-h-dvh w-full max-w-[390px] md:mx-0 md:max-w-none md:flex-1">
              <div className="mx-auto w-full max-w-[390px] md:max-w-[640px] md:px-4">
                {children}
              </div>
            </div>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
