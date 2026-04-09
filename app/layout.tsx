import type { Metadata } from "next";
import "./globals.css";
import MusicPlayer from "../components/MusicPlayer";

export const metadata: Metadata = {
  title: "Game Room - Play Together",
  description: "Multiplayer game room for couples and friends",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#1e293b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Game Room",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased">
        {children}
        <MusicPlayer />
      </body>
    </html>
  );
}