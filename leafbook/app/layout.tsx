import "./globals.css";

import type { Metadata } from "next";
import { Caveat,Lora, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "next-themes";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Leafbook — A warm, modern plant journal",
  description: "Journal your plants. Track care with one tap. Build a story for every leaf.",
};

const lora = Lora({
  variable: "--font-serif",
  display: "swap",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  display: "swap",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-handwritten",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sourceSans.variable} ${lora.variable} ${caveat.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
