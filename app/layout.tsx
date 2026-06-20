import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "katex/dist/katex.min.css";
import "./globals.css";

const description = "Markdownで書けるLaTeX風レポート作成アプリ";

export const metadata: Metadata = {
  title: "ReportMD",
  description,
  manifest: "/manifest.webmanifest",
  applicationName: "ReportMD",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "ReportMD",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "ReportMD",
    description,
    siteName: "ReportMD",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ReportMD",
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
        <meta name="apple-mobile-web-app-title" content="ReportMD" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
