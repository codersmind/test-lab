import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { FCMProvider } from "@/components/providers/FCMProvider";
import { PWAProvider } from "@/components/providers/PWAProvider";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "MailBox",
  description: "Professional email for your team — send, receive, and stay notified.",
  applicationName: "MailBox",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MailBox",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a73e8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AuthProvider>
          <PWAProvider>
            <FCMProvider>{children}</FCMProvider>
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
