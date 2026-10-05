// src/mocks/chelleConfig.ts
import type { ClassItem, SiteConfig, SiteProduct, ProductOptions } from "@/types/site";

// ---- Image URLs (Etsy CDN — swap for /public/chelle/* imports or S3 keys later) ----
const etsyImg = (path: string, size: 300 | 600 | 800 | 1000 = 800) =>
  `https://i.etsystatic.com/47599280/r/il/${path.replace("{size}", `${size}x${size}`)}`;

const octopusImg = (s?: 300 | 600 | 800 | 1000) => etsyImg("d491cd/6351032865/il_{size}.6351032865_eiz7.jpg", s);
const bucketHatImg = (s?: 300 | 600 | 800 | 1000) => etsyImg("4a4927/6276586701/il_{size}.6276586701_jyp4.jpg", s);
const measuringTapeImg = (s?: 300 | 600 | 800 | 1000) => etsyImg("c35028/7668339386/il_{size}.7668339386_aqwy.jpg", s);
const penguinImg = (s?: 300 | 600 | 800 | 1000) => etsyImg("54b7ee/7679115734/il_{size}.7679115734_a0ug.jpg", s);
const earwarmerImg = (s?: 300 | 600 | 800 | 1000) => etsyImg("da28c6/6476802206/il_{size}.6476802206_7led.jpg", s);
const beanieImg = (s?: 300 | 600 | 800 | 1000) => etsyImg("566b46/6452090011/il_{size}.6452090011_lqo1.jpg", s);
const scrubbiesImg = (s?: 300 | 600 | 800 | 1000) => etsyImg("635629/6406841365/il_{size}.6406841365_c3f4.jpg", s);

const logoImg = bucketHatImg(300);

// TODO: replace with Chelle's real contact email
const supportEmail = "support@chellesfibercrafts.com";
const etsyShopHref = "https://www.etsy.com/shop/ChellesFiberCrafts";

// Social links — leave "" to hide a link until it exists.
const SOCIAL_LINKS = {
  instagram: "", // TODO: e.g. "https://www.instagram.com/<handle>/"
  tiktok: "", // TODO
  facebook: "", // TODO
};
const activeSocials = (Object.entries(SOCIAL_LINKS) as [keyof typeof SOCIAL_LINKS, string][])
  .filter(([, href]) => href)
  .map(([type, href]) => ({ type, href, label: type[0].toUpperCase() + type.slice(1) }));

// ======================
// CUSTOM ORDER REQUEST (Google Form)
// ======================
// Google Form submissions are fire-and-forget (no-cors), so a wrong URL fails silently.
// The /custom page shows an email fallback instead of the form until formUrl is filled in.
// Get entry IDs from the form's "Get pre-filled link" (each field shows up as entry.123456789=...).
const CUSTOM_REQUEST_FORM = {
  formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeux68JOlIX9mbQIT7Wh45hf5MSnyrnGOJ4fBTW7b9QrRx9UA/formResponse",
  fieldMap: {
    name: "entry.47312220",
    email: "entry.938794542",
    phone: "entry.749279217",
    "item-type": "entry.1588197410",
    "needed-by": "entry.123344657",
    budget: "entry.1112829837",
    details: "entry.1916565206",
  },
};
const customRequestReady = CUSTOM_REQUEST_FORM.formUrl !== "";

// ======================
// PRODUCT LISTINGS
// ======================
// Checkout is off (settings.payments.cartActive = false), so each product's
// "Buy on Etsy" button opens its purchaseUrl. Variant options (size/color) are
// picked on Etsy, so none are set here yet.

function buildProduct(args: {
  categorySlug: string;
  categoryTitle: string;
  baseIndex: number;
  name: string;
  subtitle?: string;
  price: number; // cents
  compareAtPrice?: number;
  imageUrl: string;
  extraImages?: { url: string; alt: string }[];
  summary: string;
  description: string;
  features: string[];
  badges?: string[];
  stock?: SiteProduct["stock"];
  quantityAvailable?: number;
  maxQuantity?: number;
  options?: ProductOptions[];
  featured?: boolean;
  purchaseUrl?: string;
}): SiteProduct {
  return {
    id: `cfc-${args.categorySlug}-${args.baseIndex}`,
    name: args.name,
    subtitle: args.subtitle,
    category: args.categoryTitle,
    price: args.price,
    compareAtPrice: args.compareAtPrice,
    currency: "USD",
    thumbnailUrl: args.imageUrl,
    images: [{ url: args.imageUrl, alt: args.name }, ...(args.extraImages ?? [])],
    summary: args.summary,
    description: args.description,
    features: args.features,
    badges: [args.categoryTitle, ...(args.badges ?? [])],
    stock: args.stock ?? "in_stock",
    quantityAvailable: args.quantityAvailable,
    options: args.options,
    maxQuantity: args.maxQuantity ?? 10,
    taxable: true,
    featured: args.featured,
    ctaLabel: "Buy on Etsy",
    purchaseUrl: args.purchaseUrl,
  };
}

const PRODUCT_DATA = [
  {
    title: "Plushies",
    categorySlug: "plushies",
    items: [
      {
        name: 'Giant Octopus Plushie (Approx. 32")',
        subtitle: "Made to order crochet octopus",
        price: 12500,
        imageUrl: octopusImg(1000),
        summary: "A huge, super-soft plush crochet octopus.",
        description:
          'Made-to-order plush crochet octopus, approx. 32". Great as a statement plush, cozy companion, or decor.',
        features: ["Made to order", 'Approx. 32" plush', "Handmade crochet"],
        badges: ["Made to Order"],
        maxQuantity: 3,
        featured: true,
        purchaseUrl: "https://www.etsy.com/listing/1731259768/giant-octopus-plushie-made-to-order",
      },
      {
        name: 'Penguin Plushie (Approx. 10")',
        subtitle: "Handmade crocheted animal",
        price: 2000,
        imageUrl: penguinImg(),
        summary: "A cute penguin plushie — soft, squishy, and handmade.",
        description: 'Handmade crocheted penguin plushie, approx. 10".',
        features: ["Handmade crochet", 'Approx. 10"', "Gift ready"],
        badges: ["Only 1 left"],
        stock: "low_stock" as const,
        quantityAvailable: 1,
        maxQuantity: 1,
        purchaseUrl: "https://www.etsy.com/listing/4417600167/penguin-plushie-approx-10-plush-handmade",
      },
    ],
  },
  {
    title: "Apparel",
    categorySlug: "apparel",
    items: [
      {
        name: "Colorful Granny-Stitch Bucket Hat",
        subtitle: "100% cotton",
        price: 3000,
        imageUrl: bucketHatImg(1000),
        summary: "A bright, comfy bucket hat with granny-stitch style.",
        description: "Handmade cotton bucket hat — colorful, breathable, and perfect for everyday wear.",
        features: ["Handmade", "Cotton", "Lightweight"],
        badges: ["Popular"],
        maxQuantity: 5,
        featured: true,
        purchaseUrl: "https://www.etsy.com/listing/1745550181/colorful-granny-stitch-bucket-hat-cotton",
      },
      {
        name: "Knit Winter Beanie (Removable Pom)",
        subtitle: "Custom colors available",
        price: 3000,
        imageUrl: beanieImg(),
        summary: "Warm winter beanie with a removable pom.",
        description: "Handmade knit beanie with removable pom. Custom colors available.",
        features: ["Removable pom", "Custom colors", "Handmade knit"],
        badges: ["Custom"],
        maxQuantity: 5,
        featured: true,
        purchaseUrl: "https://www.etsy.com/listing/1820740853/knit-winter-beanie-w-removable-pom",
      },
      {
        name: "Handmade Striped Knit Earwarmer",
        subtitle: "Acrylic, adult size",
        price: 2000,
        imageUrl: earwarmerImg(),
        summary: "Cozy earwarmer for chilly days — comfy and stylish.",
        description: "Handmade striped knit earwarmer designed for comfort.",
        features: ["Handmade knit", "Warm + comfy"],
        maxQuantity: 5,
        purchaseUrl: "https://www.etsy.com/listing/1738667986/handmade-striped-knit-earwarmer-acrylic",
      },
    ],
  },
  {
    title: "Home & Notions",
    categorySlug: "home",
    items: [
      {
        name: "Reusable Cotton Scrubbies",
        subtitle: "Face, body, dishes, and more",
        price: 99,
        imageUrl: scrubbiesImg(),
        summary: "Eco-friendly scrubbies for home + self care.",
        description: "Reusable cotton scrubbies for skincare routines, cleaning, and everyday tasks.",
        features: ["Reusable", "Cotton", "Multi-use"],
        maxQuantity: 20,
        purchaseUrl: "https://www.etsy.com/listing/1811614163/reusable-cotton-scrubbies-for-face-body",
      },
      {
        name: "Floral Retractable Measuring Tape",
        subtitle: "For tailors, crafters, and more",
        price: 1495,
        imageUrl: measuringTapeImg(1000),
        summary: "Cute + functional retractable measuring tape.",
        description:
          "A handy measuring tape with an adorable floral design — great for sewing, crafting, and fiber projects.",
        features: ["Retractable", "Giftable", "Craft essential"],
        maxQuantity: 10,
        purchaseUrl: "https://www.etsy.com/listing/4451319358/adorable-and-functional-floral",
      },
    ],
  },
];

const shopProducts: SiteProduct[] = PRODUCT_DATA.flatMap((cat) =>
  cat.items.map((p, itemIdx) =>
    buildProduct({
      ...p,
      categorySlug: cat.categorySlug,
      categoryTitle: cat.title,
      baseIndex: itemIdx + 1,
    })
  )
);

// ======================
// CLASSES (mock — mirrors the live CM Florals classes setup)
// ======================
// While checkout is off, ClassList shows class info but no booking; class spots
// are requested through the custom request form (see the classes page CTA).
// TODO: replace with Chelle's real classes, or remove the classes page + header link.
const CHECKOUT_ENABLED = false;
const classLocation = "Chelle's Studio (address sent after booking)"; // TODO

const classItems: ClassItem[] = [
  {
    id: "class-beginner-crochet",
    name: "Beginner Crochet: Granny Squares",
    subtitle: "No experience needed",
    description:
      "Learn the basics of crochet from the ground up — holding the hook, chain stitches, single and double crochet — and finish the class with your first granny square. All yarn and a hook to take home are included.",
    price: 3500,
    currency: "USD",
    thumbnailUrl: bucketHatImg(),
    images: [{ url: bucketHatImg(), alt: "Granny-stitch bucket hat" }],
    times: [
      { id: "time-gs-1", date: "2026-11-07", startTime: "13:00", endTime: "15:00", capacity: 8, location: classLocation },
      { id: "time-gs-2", date: "2026-11-21", startTime: "13:00", endTime: "15:00", capacity: 8, location: classLocation },
      { id: "time-gs-3", date: "2026-12-05", startTime: "13:00", endTime: "15:00", capacity: 8, location: classLocation },
    ],
  },
  {
    id: "class-amigurumi",
    name: "Make Your Own Plushie",
    subtitle: "Amigurumi workshop",
    description:
      "Crochet a small amigurumi critter in the round. We'll cover magic rings, increases and decreases, stuffing, and attaching safety eyes. Some crochet basics recommended.",
    price: 4500,
    currency: "USD",
    thumbnailUrl: penguinImg(),
    images: [{ url: penguinImg(), alt: "Crochet penguin plushie" }],
    options: [
      {
        label: "Choose your critter",
        optionItems: [
          { label: "Penguin", value: "penguin", default: true, price: 4500 },
          { label: "Mini Octopus", value: "octopus", price: 4500 },
        ],
      },
    ],
    times: [
      { id: "time-am-1", date: "2026-11-14", startTime: "18:00", endTime: "20:30", capacity: 6, location: classLocation },
      { id: "time-am-2", date: "2026-12-12", startTime: "18:00", endTime: "20:30", capacity: 6, location: classLocation },
    ],
  },
];

export const mockSiteConfig: SiteConfig = {
  theme: {
    preset: "custom",
    radius: "xl",
    // Pulled from Chelle's terracotta / sage / cream / peach bucket hat.
    // primary + accent stay dark enough for white button text (text2);
    // bg2 stays light because the testimonials band puts dark text (text1) on it.
    colors: {
      primary: "#c4603f", // terracotta crown
      accent: "#5f6f50", // sage green body
      bg: "#faf6ef", // cream strands
      bg2: "#f1cdb7", // peach brim
      fg: "#2f332b", // deep olive charcoal
      muted: "#56664a", // muted sage for secondary text
      text1: "#2f332b",
      text2: "#ffffff",
    },
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  showHeader: true,
  header: {
    id: "hdr",
    type: "header",
    logoText: "Chelle's Fiber Crafts",
    logoImage: logoImg,
    links: [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
      { label: "Crochet Classes", href: "/classes" },
      { label: "Crochet Parties", href: "/parties" },
      { label: "Markets & Events", href: "/events" },
      { label: "Custom Orders", href: "/custom" },
      { label: "Contact", href: "/contact" },
    ],
    cta: { label: "Shop Now", href: "/shop" },
    style: { sticky: true, blur: true, elevation: "sm", transparent: false },
    visible: true,
  },

  sections: [
    {
      id: "bannerCarousel-home",
      type: "bannerCarousel",
      visible: true,
      items: [
        {
          title: "Holiday custom orders are open",
          body: "Beanies, plushies and gifts made to order",
          backgroundUrl: beanieImg(1000),
          overlay: true,
          imageUrl: beanieImg(300),
          href: "/custom",
        },
        {
          title: "Now booking crochet classes",
          body: "Beginner granny squares + plushie workshops",
          backgroundUrl: bucketHatImg(1000),
          overlay: true,
          imageUrl: penguinImg(300),
          href: "/classes",
        },
      ],
      intervalMs: 5000,
    },
    {
      id: "hero-home",
      type: "hero",
      visible: true,
      eyebrow: "Chelle's Fiber Crafts • Knit & Crochet • Plushies • Classes",
      title: "Handmade Knit & Crochet, Made With Love",
      subtitle:
        "Cozy apparel, huggable plushies, and handy fiber-art goodies — each piece stitched by hand.\nShop ready-made pieces on Etsy, request something custom, or learn to crochet with us.",
      primaryCta: { label: "Shop Now", href: "/shop" },
      secondaryCta: { label: "Join a Class", href: "/classes" },
      imageUrl: octopusImg(1000),
      bottomWaveType: "1-hill",
    },
    {
      id: "classList-home",
      type: "classList",
      // Booking needs checkout; until then the full class info lives on /classes.
      visible: CHECKOUT_ENABLED,
      title: "Join Our Classes",
      subtitle: "",
      buyCtaFallback: "Book Now",
    },
    {
      visible: true,
      id: "create",
      type: "features",
      title: "What we create",
      items: [
        {
          title: "Plushies & Amigurumi",
          body: "Handmade crochet plushies designed to be hugged, gifted, and displayed — from pocket-size critters to a giant 32\" octopus.",
          imageUrl: octopusImg(),
          link: "/shop",
        },
        {
          title: "Knit + Crochet Apparel",
          body: "Beanies, earwarmers, bucket hats, and cozy wearables — custom colors and sizes available.",
          imageUrl: beanieImg(),
          link: "/custom",
        },
        {
          title: "Home Goods & Notions",
          body: "Reusable cotton scrubbies, cute craft tools, and small add-on gifts for the fiber lovers in your life.",
          imageUrl: measuringTapeImg(),
          link: "/shop",
        },
      ],
      bottomWaveType: "1-hill",
    },
    {
      id: "about-shop",
      type: "about",
      visible: true,
      title: "Welcome to Chelle's Fiber Crafts!",
      subtitle: "Handmade in the USA • Ships nationwide", // TODO: add city/state if wanted
      body:
        "Every piece in the shop is knit or crocheted by hand, one stitch at a time. We make cozy wearables, huggable plushies, and practical home goods — and love bringing custom ideas to life.\n\nLooking for a specific color, size, or critter? Send a custom order request and we'll work out the details together.\n\nWant to learn the craft yourself? Join one of our beginner-friendly crochet classes or book a private crochet party for your group.",
      imageUrl: bucketHatImg(),
      bullets: [],
      align: "left",
      topWaveType: "1-hill",
    },
    {
      visible: true,
      id: "gallery",
      type: "gallery",
      title: "Previous Work",
      subtitle: "plushies, wearables and custom pieces",
      style: { columns: 4, rounded: "xl", gap: "md" },
      backgroundClass: "bg-gradient-2",
      items: [
        { imageUrl: octopusImg(), alt: "Giant crochet octopus plushie" },
        { imageUrl: bucketHatImg(), alt: "Granny-stitch bucket hat" },
        { imageUrl: beanieImg(), alt: "Knit beanie with pom" },
        { imageUrl: penguinImg(), alt: "Crochet penguin plushie" },
        { imageUrl: earwarmerImg(), alt: "Striped knit earwarmer" },
        { imageUrl: scrubbiesImg(), alt: "Cotton scrubbies" },
        { imageUrl: measuringTapeImg(), alt: "Floral measuring tape" },
      ],
      bottomWaveType: "1-hill",
      topWaveType: "1-hill",
    },
    {
      visible: true,
      id: "floating",
      type: "sectional",
      title: "Every stitch made by hand",
      body: "Cozy, colorful fiber art that brings a little warmth to everyday life.",
      backgroundUrl: bucketHatImg(1000),
      overlay: true,
      height: "md",
    },
    {
      visible: true,
      id: "testimonials",
      type: "testimonials",
      title: "What Customers Say",
      topWaveType: "1-hill",
      bottomWaveType: "1-hill",
      subtitle: "Feedback from our Etsy customers",
      items: [
        {
          quote: "Amazing timing! Really comfortable and looks great! Thanks for warming up the holidays :)",
          name: "Kent",
          role: "Customer",
        },
        {
          quote:
            "The craftsmanship is exceptional—each stitch is perfectly placed, and the texture is so soft and comfortable. It fits wonderfully and stays in place all day.",
          name: "Brittney",
          role: "Customer",
        },
        {
          quote:
            "I LOVE my octopus so much. It’s so soft and plushy definitely some good quality stuff. Very good sizing too!",
          name: "Donald",
          role: "Customer",
        },
      ],
      style: {
        variant: "carousel",
        columns: 2,
        showQuoteIcon: true,
        rounded: "xl",
        background: "band",
      },
    },
    {
      visible: true,
      id: "socials",
      type: "socials",
      title: "Follow Us",
      subtitle: "Follow along for new makes, markets, and class dates.",
      items: [{ type: "website", href: etsyShopHref, label: "Etsy" }, ...activeSocials],
      style: {
        background: "band",
        rounded: "xl",
        size: "lg",
        gap: "md",
        align: "center",
      },
      bottomWaveType: "1-hill",
    },
    {
      visible: true,
      id: "sectional-cozy",
      type: "sectional",
      title: "Made to be loved for years",
      body: "Quality yarn, careful finishing, and a whole lot of heart in every piece.",
      backgroundUrl: beanieImg(1000),
      overlay: true,
      height: "md",
    },
    {
      visible: true,
      id: "about",
      type: "about",
      // TODO: replace with Chelle's real bio
      title: "About the Maker — Chelle",
      body:
        "I picked up my first crochet hook years ago and never put it down. What started as gifts for friends and family grew into Chelle's Fiber Crafts — a little shop of cozy wearables, huggable plushies, and handy home goods. Every piece is made by hand, and I love teaching beginners and working with customers to bring custom ideas to life.",
      imageUrl: "/MichelleGould.png",
      backgroundClass: "",
      topWaveType: "1-hill",
    },
    {
      visible: true,
      id: "book",
      type: "cta",
      title: "Have something special in mind?",
      body: "Custom colors, sizes, and critters are always welcome.",
      cta: { label: "Start a Custom Order", href: "/custom" },
    },
    {
      id: "partners-home",
      type: "partners",
      visible: true,
      title: "Where to Find Us",
      subtitle: "",
      items: [
        {
          name: "Etsy",
          description: "Our full shop — every ready-made piece is listed here.",
          logoUrl: logoImg,
          links: [{ type: "website", href: etsyShopHref, customLabel: "Visit Shop" }],
        },
      ],
      style: { variant: "cards", columns: 3, rounded: "xl", background: "default" },
    },
    {
      visible: true,
      id: "pay",
      type: "cta",
      title: "Ready to check out?",
      body: "All of our ready-made pieces are purchased securely through our Etsy shop.",
      cta: { label: "Shop on Etsy", href: etsyShopHref },
    },
    {
      visible: true,
      id: "share",
      type: "share",
      title: "Share this site",
      subtitle: "Scan on your phone or send to a friend.",
      style: { variant: "band", align: "center", actions: true },
      items: [{ label: "Website (this page)" }],
      backgroundClass: "bg-gradient-2-top",
    },
  ],

  // ── Footer ───────────────────────────────────────────────────────────────────
  showFooter: true,
  footer: {
    id: "ftr",
    type: "footer",
    columns: [
      {
        title: "Explore",
        links: [
          { label: "Shop", href: "/shop" },
          { label: "Crochet Classes", href: "/classes" },
          { label: "Crochet Parties", href: "/parties" },
          { label: "Markets & Events", href: "/events" },
          { label: "Custom Orders", href: "/custom" },
          { label: "About", href: "/#about" },
          { label: "Previous Work", href: "/#gallery" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Info",
        links: [
          { label: "Chelle's Fiber Crafts", href: "/" },
          { label: "Ships within the US", href: "/contact" },
          { label: "Checkout handled securely by Etsy", href: etsyShopHref },
          { label: "Custom orders: 2–4 week turnaround", href: "/custom" },
        ],
      },
      {
        title: "Connect",
        links: [
          { label: supportEmail, href: `mailto:${supportEmail}` },
          { label: "Etsy Shop", href: etsyShopHref },
          ...activeSocials.map(({ label, href }) => ({ label, href })),
        ],
      },
    ],
    legal: "© 2026 Chelle's Fiber Crafts. All rights reserved.",
    visible: true,
  },

  meta: {
    title: "Chelle's Fiber Crafts — Handmade Knit & Crochet",
    description:
      "Chelle's Fiber Crafts makes handmade knit and crochet apparel, plushies, and cozy gifts. Shop on Etsy, request a custom order, or join a crochet class.",
    favicon: logoImg,
  },

  settings: {
    general: {
      businessDisplayName: "Chelle's Fiber Crafts",
      businessNotificationEmail: "orders@chellesfibercrafts.com", // TODO: replace
      siteDisabled: {
        enabled: false,
        message:
          "Chelle's Fiber Crafts is getting a refresh. Follow us or visit our Etsy shop for the latest updates.",
        logoImage: logoImg,
        logoRounded: true,
        logoSize: "lg",
        socials: [{ type: "website", href: etsyShopHref, label: "Etsy" }, ...activeSocials],
      },
    },
    payments: {
      // Checkout OFF for now — products link out to Etsy. Everything below is
      // scaffolding for when on-site checkout is set up; it's unused while cartActive is false.
      cartActive: CHECKOUT_ENABLED,
      paymentType: "externalLink",
      externalPaymentUrl: "", // TODO: payment link (Venmo, Square, etc.) or switch to clover/converge
      supportEmail,
      taxes: {
        enabled: false,
        ratePercent: 0,
        taxShipping: false,
        defaultProductTaxable: true,
      },
      delivery: {
        enabled: true,
        type: "flat",
        flatFeeCents: 800, // TODO: set real shipping
        mode: "both",
        addressCapture: {
          enabled: true,
          required: true,
          method: "s3",
          s3Prefix: "orders/chelles-fiber-crafts/",
        },
        driverTipEnabled: false,
      },
      // No order Google Form yet — set googleFormUrl + entry IDs to mirror orders into a sheet.
      googleFormOptions: { addItemToGForm: false },
      googleFormSubmitBeforePayment: false,
      promoCodes: [{ promoId: "COZY10", type: "percentage", value: 10 }],
      checkoutInputs: [
        {
          id: "customer-name",
          label: "Name",
          type: "text",
          required: true,
          placeholder: "Enter your full name",
          description: "The name of the person placing the order.",
        },
        {
          id: "customer-email",
          label: "Email",
          type: "email",
          required: true,
          placeholder: "you@example.com",
          description: "Order updates and shipping info are sent here.",
        },
        {
          id: "customer-phone",
          label: "Phone",
          type: "tel",
          placeholder: "(555) 555-5555",
        },
        {
          id: "special-instructions",
          label: "Special Instructions",
          type: "textarea",
          placeholder: "Color requests, sizing notes, gift message, etc.",
        },
      ],
    },
  },

  products: {
    showFilters: true,
    categoryOrder: PRODUCT_DATA.map((c) => c.title),
    items: shopProducts,
  },

  // ── Pages (rendered at /[slug], share header/footer) ───────────────────────
  pages: [
    {
      slug: "events",
      title: "Markets & Events",
      sections: [
        {
          id: "hero-events",
          type: "hero",
          visible: true,
          eyebrow: "craft fairs - pop-up markets - event favors",
          title: "Markets & Events",
          // TODO: list real upcoming markets
          subtitle:
            "Catch us in person at local craft fairs and pop-up markets, or order handmade favors and gifts for your event — baby showers, birthdays, weddings, corporate gifts, and more.",
          imageUrl: octopusImg(1000),
          primaryCta: { label: "Learn more", href: "/events#features-events" },
          secondaryCta: { label: "Get Started", href: "/custom" },
        },
        {
          id: "features-events",
          type: "features",
          visible: true,
          title: "What we do",
          items: [
            {
              title: "Pop-Up Markets",
              body: "Shop plushies, hats, and gifts in person — follow us for upcoming market dates.",
              imageUrl: bucketHatImg(),
              imageSize: "md",
            },
            {
              title: "Event Favors",
              body: "Mini plushies, scrubbies, and keepsakes in your event colors for showers, parties, and weddings.",
              imageUrl: scrubbiesImg(),
              imageSize: "md",
            },
            {
              title: "Corporate & Bulk Gifts",
              body: "Handmade client or team gifts with custom colors — just ask about quantities and timelines.",
              imageUrl: earwarmerImg(),
              imageSize: "md",
            },
          ],
          // bottomWaveType: "1-hill",
        },
        {
          id: "cta-events",
          type: "cta",
          visible: true,
          title: "Tell us about your event",
          body: "Share your date, colors, and quantity and we'll get back to you with a quote.",
          cta: { label: "Request a Quote", href: "/custom" },
        },
      ],
    },
    {
      slug: "classes",
      title: "Crochet Classes",
      sections: [
        {
          id: "sectional-classes",
          type: "sectional",
          visible: true,
          title: "Crochet Classes",
          body:
            "Learn to crochet in a relaxed, beginner-friendly class! You'll be guided step by step and leave with a finished piece and the skills to keep going.\n\nEverything is included:\n• Yarn and a crochet hook to take home\n• Step-by-step instruction\n• Your finished project\n\nCome solo, bring a friend, or make it a group night out.",
          backgroundUrl: bucketHatImg(1000),
          overlay: true,
          align: "center",
          height: "full",
          topWaveType: "2-cave",
          subtitleAlign: "left",
        },
        {
          id: "classList-classes",
          type: "classList",
          visible: true,
          title: "Choose a Class",
          subtitle: CHECKOUT_ENABLED ? "" : "To reserve a spot, send us a request with the class and date you'd like.",
          buyCtaFallback: "Book Now",
          topWaveType: "1-hill",
        },
        {
          id: "cta-classes",
          type: "cta",
          visible: true,
          title: CHECKOUT_ENABLED ? "Get Involved" : "Reserve Your Spot",
          body: "Tell us which class and date you'd like (or ask to join the waitlist) and we'll confirm your spot.",
          cta: customRequestReady
            ? { label: "Request a Spot", href: "/custom" }
            : { label: "Email Us", href: `mailto:${supportEmail}` },
        },
      ],
    },
    {
      slug: "shop",
      title: "Shop",
      sections: [
        {
          id: "productShop-shop",
          type: "productShop",
          visible: true,
          title: "Shop Handmade",
          subtitle: "Browse here, then check out securely on Etsy",
        },
        {
          visible: true,
          id: "cta-shop",
          type: "cta",
          title: "Need something else?",
          body: "Custom colors, sizes, and critters are always welcome.",
          cta: { label: "Custom Orders", href: "/custom" },
        },
      ],
    },
    {
      slug: "parties",
      title: "Crochet Parties",
      sections: [
        {
          id: "cta-parties",
          type: "cta",
          visible: true,
          title: "Book a Private Crochet Party!",
          body:
            "Perfect for birthdays, girls' nights, team outings, and showers — we'll guide your group through a fun, beginner-friendly project in a relaxed atmosphere. Everyone takes home what they make!",
          cta: { label: "Get Started", href: "/custom" },
        },
        {
          id: "features-parties",
          type: "features",
          visible: true,
          title: "",
          items: [
            {
              title: "Crochet Party at Your Place",
              body: "We bring the yarn, hooks, and instruction to your home or venue. Great for groups of 4–12. Inquire with our custom request form!",
              imageUrl: scrubbiesImg(),
              imageSize: "md",
              link: "/custom",
            },
            {
              title: "Private Plushie Workshop",
              body: "Led by Chelle, your group crochets their own mini plushie — perfect for birthdays and creative nights out. Inquire with our custom request form!",
              imageUrl: penguinImg(),
              imageSize: "md",
              link: "/custom",
            },
          ],
        },
      ],
    },
    {
      slug: "custom",
      title: "Custom Orders",
      sections: [
        {
          // Shown once CUSTOM_REQUEST_FORM is filled in (see top of file)
          visible: customRequestReady,
          backgroundUrl: beanieImg(1000),
          id: "sendAMessage-custom",
          type: "sendAMessage",
          title: "Custom Order Request",
          subtitle: "Have a color, size, or critter in mind? Let's make it.",
          description:
            "Fill out the form below with as much detail as you can and Chelle will follow up with a quote and timeline. Use this form for class spots and crochet parties too!",
          submission: { type: "googleForm", ...CUSTOM_REQUEST_FORM },
          submitLabel: "Send My Request",
          successTitle: "Request received!",
          successMessage: "Thank you! Chelle will review your request and reach out within 2–3 business days.",
          fields: [
            { id: "name", label: "Your Name", type: "text", placeholder: "Full name", required: true },
            { id: "email", label: "Email Address", type: "email", placeholder: "your@email.com", required: true },
            { id: "phone", label: "Phone Number", type: "phone", placeholder: "(555) 555-5555" },
            {
              id: "item-type",
              label: "What can we help with?",
              type: "select",
              required: true,
              options: [
                "Plushie / Amigurumi",
                "Hat / Beanie",
                "Earwarmer / Headband",
                "Scarf / Cowl",
                "Blanket",
                "Home Goods",
                "Event Favors / Bulk Order",
                "Class Spot",
                "Crochet Party",
                "Other",
              ],
            },
            { id: "needed-by", label: "Needed By / Preferred Date", type: "text", placeholder: "MM/DD/YYYY" },
            { id: "budget", label: "Approximate Budget", type: "text", placeholder: "e.g. $30–$75" },
            {
              id: "details",
              label: "Colors, Size & Details",
              type: "textarea",
              placeholder: "Colors, yarn preference, size or measurements, class/date, group size — anything that helps.",
              required: true,
            },
          ],
        },
        {
          // Fallback while the form isn't set up yet
          visible: !customRequestReady,
          id: "cta-custom-fallback",
          type: "cta",
          title: "Custom Orders",
          body: "Want a custom color, size, or critter? Message us on Etsy or email us with the details and we'll get back to you with a quote.",
          cta: { label: "Email Us", href: `mailto:${supportEmail}` },
        },
        {
          id: "gallery-custom",
          type: "gallery",
          visible: true,
          subtitle: "",
          style: { columns: 3, rounded: "xl", gap: "md" },
          items: [
            { imageUrl: octopusImg(), alt: "Giant crochet octopus plushie" },
            { imageUrl: beanieImg(), alt: "Knit beanie with pom" },
            { imageUrl: bucketHatImg(), alt: "Granny-stitch bucket hat" },
          ],
          topWaveType: "1-hill",
        },
        {
          visible: true,
          id: "socials-custom",
          type: "socials",
          title: "Follow Us",
          subtitle: "See new makes and custom pieces as they're finished.",
          items: [{ type: "website", href: etsyShopHref, label: "Etsy" }, ...activeSocials],
          style: { background: "band", rounded: "xl", size: "lg", gap: "md", align: "center" },
          bottomWaveType: "1-hill",
        },
      ],
    },
    {
      slug: "contact",
      title: "Contact",
      sections: [
        {
          visible: true,
          id: "contact-main",
          type: "contact",
          title: "Get in Touch",
          email: supportEmail,
          address: "Ships anywhere in the United States", // TODO: add studio/pickup location if any
          // phone: { label: "(555) 555-5555", href: "tel:15555555555" }, // TODO: add if wanted
          backgroundUrl: bucketHatImg(1000),
          socials: [
            { label: "Etsy", href: etsyShopHref },
            ...activeSocials.map(({ label, href }) => ({ label, href })),
          ],
        },
        {
          visible: true,
          id: "socials-contact",
          type: "socials",
          title: "Follow Us",
          subtitle: "Follow along for new makes, markets, and class dates.",
          items: [{ type: "website", href: etsyShopHref, label: "Etsy" }, ...activeSocials],
          style: { background: "band", rounded: "xl", size: "lg", gap: "md", align: "center" },
          topWaveType: "1-hill",
        },
        {
          visible: true,
          id: "cta-contact",
          type: "cta",
          title: "Ready to start?",
          body: "Shop ready-made pieces or send us your custom idea.",
          cta: { label: "Shop on Etsy", href: etsyShopHref },
        },
      ],
    },
  ],

  classes: {
    classItems,
    locations: [classLocation],
  },
};
