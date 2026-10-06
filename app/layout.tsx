import type { Metadata } from "next";
import localFont from "next/font/local";
import { RatesProvider } from "@/components/RatesProvider";
import { Shell } from "@/components/Shell";
import { getRates } from "@/lib/fx";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const rates = await getRates();
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <RatesProvider rates={rates}>
          <Shell>{children}</Shell>
        </RatesProvider>
      </body>
    </html>
  );
}
