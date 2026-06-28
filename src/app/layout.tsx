import type { Metadata, Viewport } from "next";
import { Quicksand, Noto_Sans, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const display = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const thai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-thai",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "XinXin Snacks & Beauty | ขนมและเครื่องสำอางจีนส่งตรงจากจีน",
    template: "%s · XinXin Snacks & Beauty",
  },
  description:
    "ร้านขนมและเครื่องสำอางจีนส่งตรงจากจีน คัดสรรสินค้ายอดนิยมจาก Xiaohongshu และ TikTok ส่งถึงบ้านคุณทั่วประเทศไทย 🌸",
  keywords: [
    "ขนมจีน",
    "เครื่องสำอางจีน",
    "Xiaohongshu",
    "TikTok Shop",
    "cross-border",
    "snacks",
    "beauty",
  ],
  openGraph: {
    title: "XinXin Snacks & Beauty",
    description: "ร้านขนมและเครื่องสำอางจีนส่งตรงจากจีน 🌸",
    type: "website",
    locale: "th_TH",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B9D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${display.variable} ${sans.variable} ${thai.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
