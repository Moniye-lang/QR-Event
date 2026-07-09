import type { Metadata } from "next";
import { Inter, Playfair_Display, Great_Vibes } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Felix Adeniyi Golden Celebration Birthday Party",
  description: "You're invited to an exclusive 50th birthday celebration. RSVP to secure your entry pass.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ]
  },
  openGraph: {
    title: "Felix Adeniyi Golden Celebration Birthday Party",
    description: "You're invited to an exclusive 50th birthday celebration. RSVP to secure your entry pass.",
    images: [
      {
        url: "/premium_cover.png",
        width: 1200,
        height: 630,
        alt: "Felix Adeniyi 50th Birthday Celebration",
      }
    ],
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080808]">{children}</body>
    </html>
  );
}
