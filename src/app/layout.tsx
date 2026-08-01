import type { Metadata, Viewport } from "next";
import { Playfair_Display, Allura, Alex_Brush, Cinzel } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

/* Allura: elegant wedding script whose capital "A" reads clearly as an A
   (Great Vibes drew it like an oversized lowercase "a") */
const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

const alexBrush = Alex_Brush({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brush",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-caps",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#F1E7D6",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Sushil weds Aiswary",
  description:
    "You are warmly invited to celebrate the wedding of Sushil and Aiswary — September 2026, Kochi & Bengaluru.",
  openGraph: {
    title: "Sushil weds Aiswary",
    description:
      "Join us for our wedding celebration — September 2026, Kochi & Bengaluru.",
    images: [
      {
        url: "/images/hero-couple.webp",
        width: 1024,
        height: 1536,
        alt: "Sushil & Aiswary",
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${allura.variable} ${alexBrush.variable} ${cinzel.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
