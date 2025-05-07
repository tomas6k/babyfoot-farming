import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MainNav } from "@/components/MainNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const pressStart2P = {
  variable: '--font-pixel',
  display: 'swap',
  adjustFontFallback: false,
  weight: '400',
  subsets: ['latin'],
  fallback: ['system-ui', 'arial'],
};

export const metadata: Metadata = {
  title: "Vancelian Babyfoot Kingdom",
  description: "Un jeu de babyfoot avec des mécaniques RPG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className={`min-h-screen bg-[url('/background.png')] bg-repeat ${inter.variable}`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <MainNav />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
