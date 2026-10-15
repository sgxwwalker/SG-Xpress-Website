import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sgxpressja.com";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
// Staging copies must never show up in Google.
const STAGING = process.env.NEXT_PUBLIC_SITE_ENV === "staging";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...(STAGING ? { robots: { index: false, follow: false } } : {}),
  title: {
    default: "SG Xpress Shipping | Ship from the USA and China to Jamaica",
    template: "%s | SG Xpress Shipping",
  },
  description:
    "Free US address, air from the USA three times a week, ocean freight, China Direct and barrels. Pick up at our branches or get islandwide delivery.",
  openGraph: {
    type: "website",
    siteName: "SG Xpress Shipping",
    images: ["/images/air-freight.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1d3361",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        {children}
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
            <Analytics />
          </>
        ) : null}
      </body>
    </html>
  );
}
