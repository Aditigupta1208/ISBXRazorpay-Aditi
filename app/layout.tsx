import type { Metadata } from "next";
import localFont from "next/font/local";
import { Shell } from "@/components/Shell";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dispute Advisor (concept prototype)",
  description:
    "Concept prototype for the Razorpay x ISB AI PM Build Challenge. Not an official Razorpay product.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
