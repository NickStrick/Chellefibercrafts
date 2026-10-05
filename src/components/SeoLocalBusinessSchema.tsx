export default function SeoLocalBusinessSchema() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "Chelle's Fiber Crafts",
    "description": "Handmade knit and crochet apparel, plushies, and cozy gifts.",
    ...(siteUrl ? { "url": siteUrl, "image": `${siteUrl}/og.jpg` } : {}),
    "email": "support@chellesfibercrafts.com", // TODO: replace
    "sameAs": ["https://www.etsy.com/shop/ChellesFiberCrafts"],
    "areaServed": { "@type": "Country", "name": "United States" },
    "priceRange": "$",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
