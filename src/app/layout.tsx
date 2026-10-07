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
import { getConfigFromS3, type ConfigVariant } from "@/lib/configStore";
import { SiteConfigSchema } from "@/lib/siteSchema";

// The site config lives in S3 and changes whenever the admin saves, so never
// prerender/cache this layout at build time — always render per request.
export const dynamic = "force-dynamic";

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

  // Read straight from S3 (same source as /api/config) instead of HTTP-fetching
  // our own API — no base URL to configure and no extra hop. getConfigFromS3
  // already returns null on missing object / S3 errors.
  // The admin bar saves to the draft file (configs/<site>/site.json), so
  // NEXT_PUBLIC_CONFIG_VARIANT=draft is what makes saves show up.
  const variant: ConfigVariant =
    process.env.NEXT_PUBLIC_CONFIG_VARIANT === "draft" ? "draft" : "published";

  const data = await getConfigFromS3(variant);
  if (data) {
    const parsed = SiteConfigSchema.safeParse(data);
    if (parsed.success) return parsed.data as SiteConfig;
    console.warn("[config] S3 config failed validation", parsed.error.flatten());
  } else {
    console.warn(`[config] No ${variant} config in S3`);
  }

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
