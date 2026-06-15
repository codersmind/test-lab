import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { FCMProvider } from "@/components/providers/FCMProvider";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "MailBox - Gmail Clone",
  description: "Full-featured email app with AWS SES, Firebase, and FCM",
  manifest: "/manifest.json",
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
          <FCMProvider>{children}</FCMProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
