// src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SiteProvider } from "@/context/SiteContext";
import { CartProvider } from "@/context/CartContext";
import type { SiteConfig } from "@/types/site";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import GlobalHashLinkHandler from "@/components/GlobalHashLinkHandler";
import PaymentsOverlay from "@/components/payments/PaymentsOverlay";

// ✅ Admin UI (client) — keyboard toggle + bar
import AdminGate from "@/components/admin/AdminGate";
import AdminBar from "@/components/admin/AdminBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "";

import { mockSiteConfig } from "@/mocks/chelleConfig";
import SeoLocalBusinessSchema from "@/components/SeoLocalBusinessSchema";

const siteName = "Chelle's Fiber Crafts";
const defaultTitle = `${siteName} | Handmade Knit & Crochet`;
const description =
  "Handmade knit and crochet apparel, plushies, and cozy gifts from Chelle's Fiber Crafts. Shop ready-made pieces or request a custom order.";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // helps prevent snippet weirdness, not required but solid
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: defaultTitle,
    description,
    locale: "en_US",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
    images: ["/og.jpg"],
  },
};


async function getSiteConfig(): Promise<SiteConfig> {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "1" || process.env.NEXT_PUBLIC_USE_MOCK === "2";
  if (useMock) return mockSiteConfig;

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const site = process.env.NEXT_PUBLIC_SITE_ID ?? "chelle";
  const prefer = (process.env.NEXT_PUBLIC_CONFIG_VARIANT ?? "published") as "published" | "published";
  const fallback = prefer === "published" ? "published" : "published";

  async function fetchJSON(url: string) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[config] ${url} -> ${res.status}`, text?.slice(0, 200));
        return null;
      }
      return (await res.json()) as SiteConfig;
    } catch (err) {
      // e.g. NEXT_PUBLIC_BASE_URL unset (relative URL on the server) or the API is unreachable
      console.warn(`[config] ${url} failed`, err);
      return null;
    }
  }

  // try preferred variant for this site id
  const primary = await fetchJSON(`${base}/api/config?variant=${prefer}&site=${encodeURIComponent(site)}`);
  if (primary) return primary;

  // then the other variant
  const secondary = await fetchJSON(`${base}/api/config?variant=${fallback}&site=${encodeURIComponent(site)}`);
  if (secondary) return secondary;

  console.warn("[config] Falling back to mockSiteConfig");
  return mockSiteConfig;
}


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getSiteConfig();
  const showThemeSwitcher = process.env.NEXT_PUBLIC_THEME_SWITCHER === "1";

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {googleSiteVerification ? (
          <meta name="google-site-verification" content={googleSiteVerification} />
        ) : null}
        <SeoLocalBusinessSchema />
        {googleAdsId ? (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-gtag" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAdsId}');`}
            </Script>
          </>
        ) : null}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-app`}>
        <SiteProvider initial={config}>
          <CartProvider>
            <GlobalHashLinkHandler />
            <PaymentsOverlay />
            <main className="overflow-hidden"><div id="top"></div>{children}</main>
          {showThemeSwitcher && <ThemeSwitcher />}

          {/* ✅ Admin overlay (toggle with Ctrl/Cmd + Alt + A OR Ctrl/Cmd + Shift + A)
              Also supports ?admin=1 and persists via localStorage */}
            <AdminGate>
              <AdminBar />
            </AdminGate>
          </CartProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
