import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "katex/dist/katex.min.css";
import "./globals.css";

const description = "Markdown + LaTeX math + PDF export editor";

export const metadata: Metadata = {
  title: "MDTeX",
  description,
  manifest: "/manifest.webmanifest",
  applicationName: "MDTeX",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "MDTeX",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "MDTeX",
    description,
    siteName: "MDTeX",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MDTeX",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#43836c",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="MDTeX" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
