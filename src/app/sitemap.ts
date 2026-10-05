import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cmfloralsandgifts.com";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  // Add all *real* pages you want indexed
  const routes = [
    "",
    // "/about",
    // "/contact",
    // "/wedding-florist-chicago",
    // "/event-florals-chicago",
  ];

  const now = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
