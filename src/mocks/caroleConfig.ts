// src/mocks/caroleConfig.ts
import type { SiteConfig, SiteProduct } from "@/types/site";

// ---- Image imports ----           // Hero/banner image
import booth from "../../public/carole/booth.jpg";
import cart from "../../public/carole/cart.png";
import flower2 from "../../public/carole/flower2.png";
import flower3 from "../../public/carole/cmFlower.jpg";
import flower4 from "../../public/carole/flower4.png";
import flower5 from "../../public/carole/flower5.png";
import flower6 from "../../public/carole/flower6.png";
import flower7 from "../../public/carole/flower7.png";
import flower8 from "../../public/carole/flower8.png";
import flower9 from "../../public/carole/flower9.jpg";
import flower10 from "../../public/carole/flower10.jpg";
import flower11 from "../../public/carole/flower11.jpg";
import flowertable from "../../public/carole/flowertable.jpg";
import flowertable2 from "../../public/carole/flowertable2.jpg";
import flowerwall from "../../public/carole/flowerwall.jpg";
import flowerwall2 from "../../public/carole/flowerwall2.jpg";
import flowerwall3 from "../../public/carole/flowerwall3.jpg";
import fallDecor1 from "../../public/carole/fallDecor1.jpg";
import fallDecor2 from "../../public/carole/fallDecor2.jpg";
import logoMain from "../../public/carole/booth.jpg";
import logoWhite from "../../public/carole/logo-main.jpg";
import logo2 from "../../public/carole/logo2.png";
import carole from "../../public/carole/carole2.jpg";

import review1 from "../../public/carole/reveiw1.png";
import review2 from "../../public/carole/review2.png";

// ---- Product image imports (from Excel “Picture Discription in Folder”) ----
// NOTE: I assumed these are .jpg files. If any are .png, just change the extension.
import everdayBouquetInVase from "../../public/carole/CurrentProducts/Everyday Bouquet in Vase.jpg";
import everydayOccasionsCenterpiece from "../../public/carole/CurrentProducts/Everyday Occasions Center piece.jpg";
import brightenTheirDay from "../../public/carole/CurrentProducts/Brighten their day Bouquet.jpg";
import everydayOccasions from "../../public/carole/CurrentProducts/Everyday Occasions.jpg";
import birthdayIndulgance from "../../public/carole/CurrentProducts/Birthday Indulgence.jpg";
import birthdayBasket from "../../public/carole/CurrentProducts/Happy Birthday Basket Blooms.jpg";
import happyBirthdayPinkAndPurples from "../../public/carole/CurrentProducts/Happy Birthday Pink and Purples.gif";
import luxuryBirthday from "../../public/carole/CurrentProducts/Luxury Vase Birthday Bouquet.jpg";
import anniversaryBouquetWithBalloon from "../../public/carole/CurrentProducts/Anniversary Bouquet with Balloon.jpg";
import elegantAnniversaryBouquet from "../../public/carole/CurrentProducts/Elegant Anniversary Bouquet.jpg";
import anniversaryWeddingVaseAndBouquet from "../../public/carole/CurrentProducts/Anniversary Wedding Vase Bouquet.jpg";
import theAnniversaryBouquet from "../../public/carole/CurrentProducts/The Anniversary Bouquet.jpg";
import mixedFlowerBouquetAnniversary from "../../public/carole/CurrentProducts/Mixed Flower Bouquet Anniversary.jpg";
import administrativeSunshineAndTulipsBouquetInVase from "../../public/carole/CurrentProducts/Adminisstrative Asst. Week.jpg";
import oneWithPail from "../../public/carole/CurrentProducts/Administrative Assitant Week.jpg";
import assortedTulips from "../../public/carole/CurrentProducts/Assorted Tulips.jpg";
import bouquetWithBrightColors from "../../public/carole/CurrentProducts/Extra Large Bouquet with Bright Colors.jpg";

import nosegay1 from "../../public/carole/CurrentProducts/prom/Nosegay 1.jpg";
import nosegay2 from "../../public/carole/CurrentProducts/prom/boun.png";
import nosegay3 from "../../public/carole/CurrentProducts/prom/NosegayBoun.png";
import nosegay4 from "../../public/carole/CurrentProducts/prom/Nosegay 4.png";

import administrativeDay1 from "../../public/carole/CurrentProducts/administrative/Administrative day 1.jpg";  
import administrative2 from "../../public/carole/CurrentProducts/administrative/Administrative 3.jpg"; 
import administrative6 from "../../public/carole/CurrentProducts/administrative/Administrative 6.jpg";

import CorpoTable from "../../public/carole/CurrentProducts/corporate/CorpoTable.jpg";
import CorpoTable2 from "../../public/carole/CurrentProducts/corporate/CorpoTable2.jpg"; 
import corporateOrchidBromeliad from "../../public/carole/CurrentProducts/corporate/corporateOrchidBromeliad.jpg"; 
import corporateOrchidBromeliad2 from "../../public/carole/CurrentProducts/corporate/corporateOrchidBromeliad2.jpg"; 
import corporateOrchidBromeliad3 from "../../public/carole/CurrentProducts/corporate/corporateOrchidBromeliad3.jpg"; 
import corporateOrchidBromeliad4 from "../../public/carole/CurrentProducts/corporate/corporateOrchidBromeliad4.jpg"; 
import corporateOrchidBromeliad5 from "../../public/carole/CurrentProducts/corporate/corporateOrchidBromeliad5.jpg"; 
import corporateFlowerBed2 from "../../public/carole/CurrentProducts/corporate/corporateFlowerBed.jpg"; 
import corporateFlowerBed from "../../public/carole/CurrentProducts/corporate/corporateFlowerBed2.jpg"; 
import corporateBouquet from "../../public/carole/CurrentProducts/corporate/corporateBouquet.jpg";

const phoneHref = "tel:17732094805";
const tiktokHref =
  "https://www.tiktok.com/@carolemurray87_group7?is_from_webapp=1&sender_device=pc";
const instagramHref = "https://www.instagram.com/cm_florals/";
const facebookHref = "https://www.facebook.com/carole.murray.370/";
const linkedinHref = "https://www.linkedin.com/in/carole-murray-61458b20a/";

// ======================
// PRODUCT LISTINGS (typed + image imports from Excel filenames)
// ======================
type SizeKey = "S" | "M" | "L";

const SIZE_LABEL: Record<SizeKey, string> = {
  S: "Standard",
  M: "Deluxe",
  L: "Premium",
};

function buildSizeProducts(args: {
  categorySlug: string;
  categoryBadge: string;
  baseIndex: number;
  name: string;
  subtitle?: string;
  prices: Record<SizeKey, number>; // cents
  imageUrl: string; // importedImage.src
  extraImages?: { url: string; alt: string }[];
}): SiteProduct {
  const {
    categorySlug,
    categoryBadge,
    baseIndex,
    name,
    subtitle,
    prices,
    imageUrl,
    extraImages,
  } = args;

  const mk = (): SiteProduct => ({
    id: `cmf-${categorySlug}-${baseIndex}`,
    name,
    subtitle,
    category: categoryBadge,
    price: prices.S,
    currency: "USD",
    thumbnailUrl: imageUrl,
    images: [{ url: imageUrl, alt: name }, ...(extraImages ?? [])],
    summary: `${name}`,
    description: `${name}. Crafted fresh for ${categoryBadge}.`,
    features: ["Fresh seasonal blooms", "Gift note included"],
    badges: [categoryBadge],
    stock: "in_stock",
    ctaLabel: "Buy Now",
    maxQuantity: 99,
    ...(prices.S === prices.M && prices.M === prices.L
      ? {}
      : {
          options: [
            {
              label: "Size",
              optionItems: [
                { label: SIZE_LABEL.S, value: "S", order: 1, default: true, price: prices.S },
                { label: SIZE_LABEL.M, value: "M", order: 2, price: prices.M },
                { label: SIZE_LABEL.L, value: "L", order: 3, price: prices.L },
              ],
            },
          ],
        }),
  });

  return mk();
}

const PRODUCT_DATA = [
   {
    title: "Prom",
    categorySlug: "prom",
    items: [
      {
        img: nosegay1,
        name: "Prom Nosegay Bouquet",
        subtitle: "Handheld Prom Bouquet",
        prices: { S: 4000, M: 4000, L: 4000 },
      },
      {
        img: nosegay2,
        name: "Boutonniere",
        subtitle: "Prom Boutonniere",
        prices: { S: 1500, M: 1500, L: 1500 },
      },
      {
        img: nosegay3,
        name: "Nosegay & Boutonniere",
        subtitle: "Nosegay & Boutonniere Bundle",
        prices: { S: 5000, M: 5000, L: 5000 },
      },
      {
        img: nosegay4,
        name: "Wrist Corsage",
        subtitle: "Prom Wrist Corsage",
        prices: { S: 2500, M: 2500, L: 2500 },
      },
    ],
  },
  {
    title: "Corporate",
    categorySlug: "corporate",
    items: [
      {
        img: CorpoTable,
        extraImgs: [CorpoTable2],
        name: "Executive Table Display",
        subtitle: "Premium centerpiece for corporate events & boardrooms",
        prices: { S: 12000, M: 18000, L: 25000 },
      },
      {
        img: corporateOrchidBromeliad,
        extraImgs: [corporateOrchidBromeliad2, corporateOrchidBromeliad3, corporateOrchidBromeliad4, corporateOrchidBromeliad5],
        name: "Orchid & Bromeliad Collection",
        subtitle: "Elegant tropical arrangement for executive spaces",
        prices: { S: 9000, M: 13000, L: 18000 },
      },
      {
        img: corporateFlowerBed,
        extraImgs: [corporateFlowerBed2],
        name: "Corporate Garden Display",
        subtitle: "Lush floor display for lobbies and atriums",
        prices: { S: 15000, M: 22000, L: 30000 },
      },
      {
        img: corporateBouquet,
        name: "Corporate Bouquet",
        subtitle: "Refined arrangement for desks and conference rooms",
        prices: { S: 6500, M: 9000, L: 12000 },
      },
    ],
  },
  {
    title: "Everyday Beauty's",
    categorySlug: "everyday",
    items: [
      {
        img: everdayBouquetInVase,
        name: "Simple White Elegance",
        subtitle: "Everday Bouquet in Vase",
        prices: { S: 4000, M: 6000, L: 8000 },
      },
      {
        img: everydayOccasionsCenterpiece,
        name: "Carnical Array",
        subtitle: "Everyday Occasions Centerpiece",
        prices: { S: 6000, M: 8000, L: 10000 },
      },
      {
        img: brightenTheirDay,
        name: "A little Bit of Sunshine",
        subtitle: "Brighten Their Day",
        prices: { S: 3500, M: 5000, L: 6500 },
      },
      {
        img: everydayOccasions,
        name: "Gentalmans Choice",
        subtitle: "Everyday Occasions",
        prices: { S: 4500, M: 6000, L: 7500 },
      },
    ],
  },
  {
    title: "Birthday Specials",
    categorySlug: "birthday",
    items: [
      {
        img: birthdayIndulgance,
        name: "Birthday Indulgance",
        subtitle: "Birthday indulgance",
        prices: { S: 4500, M: 6000, L: 7500 },
      },
      {
        img: birthdayBasket,
        name: "Birthday Basket Full of Fun",
        subtitle: "Birthday Basket",
        prices: { S: 5000, M: 6500, L: 8000 },
      },
      {
        img: happyBirthdayPinkAndPurples,
        name: "Happy Birthday Pink and Purples",
        subtitle: "Happy Birthday Pink and Purples",
        prices: { S: 6000, M: 7500, L: 9000 },
      },
      {
        img: luxuryBirthday,
        name: "Luxury European Lilly Mix",
        subtitle: "Luxury Birthday",
        prices: { S: 7500, M: 10000, L: 12500 },
      },
    ],
  },
  {
    title: "Anniversarys",
    categorySlug: "anniversarys",
    items: [
      {
        img: anniversaryBouquetWithBalloon,
        name: "Charming Anniversary",
        subtitle: "Anniversary Bouquet with Balloon",
        prices: { S: 4000, M: 6000, L: 8000 },
      },
      {
        img: elegantAnniversaryBouquet,
        name: "Executive Anniversary",
        subtitle: "Elegant Anniversary Bouquet",
        prices: { S: 5000, M: 6500, L: 8000 },
      },
      {
        img: anniversaryWeddingVaseAndBouquet,
        name: "Anniversary/ Wedding Vase and Bouquet",
        subtitle: "Anniversary/ Wedding Vase and Bouquet",
        prices: { S: 7500, M: 10000, L: 12500 },
      },
      {
        img: theAnniversaryBouquet,
        name: "Classic Anniversary Bouquet",
        subtitle: "The Anniversary Bouquet",
        prices: { S: 7500, M: 10000, L: 12500 },
      },
      {
        img: mixedFlowerBouquetAnniversary,
        name: "Mixed Anniversary Hand Held",
        subtitle: "Mixed Flower Bouquet Anniversary",
        prices: { S: 4500, M: 6000, L: 7500 },
      },
    ],
  },
  {
    title: "Administrative Assistant Week",
    categorySlug: "administrativeassistantweek",
    items: [
      {
        img: administrativeSunshineAndTulipsBouquetInVase,
        name: "Administrative Sunshine and Tulips Bouquet in Vase",
        subtitle: "Administrative Sunshine and Tulips Bouquet in Vase",
        prices: { S: 4000, M: 6000, L: 7500 },
      },
      {
        img: oneWithPail,
        name: "Administratives Garden Pail",
        subtitle: "One with Pail",
        prices: { S: 3000, M: 4500, L: 6000 },
      },
      {
        img: assortedTulips,
        name: "Assorted Tulips",
        subtitle: "Assorted Tulips",
        prices: { S: 2500, M: 4000, L: 6000 },
      },
      {
        img: administrativeDay1,
        name: "Bold & Brilliant",
        subtitle: "Gerbera & Rose Vase",
        prices: { S: 4500, M: 6000, L: 7500 },
      },
      {
        img: administrative2,
        name: "Vivid Celebration",
        subtitle: "Sunflower & Purple Daisy Vase",
        prices: { S: 4500, M: 6000, L: 7500 },
      },
      {
        img: administrative6,
        name: "Spring Administrative Special",
        subtitle: "Seasonal spring arrangement",
        prices: { S: 3000, M: 4500, L: 6000 },
      },
      {
        img: bouquetWithBrightColors,
        name: "The Amazing Administrative Handheld",
        subtitle: "Bouquet with Bright Colors",
        prices: { S: 2500, M: 4000, L: 5500 },
      },
    ],
  }
] as const;

const shopProducts: SiteProduct[] = PRODUCT_DATA.flatMap((cat) =>
  cat.items.map((p, itemIdx) =>
    buildSizeProducts({
      categorySlug: cat.categorySlug,
      categoryBadge: cat.title,
      baseIndex: itemIdx + 1,
      name: p.name,
      subtitle: p.subtitle,
      prices: { ...p.prices },
      imageUrl: p.img.src,
      extraImages: (p as { extraImgs?: readonly { src: string }[] }).extraImgs?.map(
        (i) => ({ url: i.src, alt: p.name })
      ),
    })
  )
);

export const mockSiteConfig: SiteConfig = {
  theme: { preset: "lavender", radius: "xl" },
  products: { showFilters: true, items: shopProducts },
  meta: {
    title: "CM Florals — Floral Design & Gifts",
    description:
      "CM Florals creates joyful floral design for weddings, holidays, celebrations and everyday gifting across Chicago. Founding Florist Carole Murray.",
    favicon: logo2.src,
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  showHeader: true,
  header: {
    id: "hdr",
    type: "header",
    logoText: "CM Florals",
    logoImage: logoWhite.src,
    links: [
      { label: "Home", href: "#top" },
      { label: "Shop", href: "#shop" },
      { label: "Custom", href: "#custom-request" },
      { label: "About", href: "#create" },
      { label: "Previous Work", href: "#gallery" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "Contact", href: "#contact" },
    ],
    cta: { label: "Order Now", href: "#shop" },
    style: { sticky: true, blur: true, elevation: "sm", transparent: false },
  },

  "settings": {
    "general": {
      "businessDisplayName": "CM Florals",
      "businessNotificationEmail": "shop@cmfloralsandgifts.com"
    },
    "payments": {
      "cartActive": true,
      "paymentType": "clover",
      "supportEmail": "shop@cmfloralsandgifts.com",
      "supportPhone": {
        "label": "Call us at 773-209-4805",
        "href": "tel:17732094805"
      },
      "taxes": {
        "enabled": true,
        "ratePercent": 10,
        "taxShipping": false,
        "defaultProductTaxable": true
      },
      "delivery": {
        "enabled": true,
        "type": "flat",
        "flatFeeCents": 1500,
        "mode": "both",
        "addressCapture": {
          "enabled": true,
          "required": true,
          "method": "googleForm",
          "googleFormEntryId": ""
        }
      },
      "googleFormOptions": {
        "addItemToGForm": true,
        "itemsEntryId": "entry.918647669",
        "totalEntryId": "entry.65280150"
      },
      "googleFormSubmitBeforePayment": false,
      "externalPaymentUrl": "https://venmo.com/u/Carole-Murray-9",
      "googleFormUrl": "https://docs.google.com/forms/d/e/1FAIpQLScPLQtqUSiP_CFn1frA3nArkkue_jTWeiE2ZVto6NHOheStrg/formResponse",
      "promoCodes": [
        { "promoId": "CoachSue", "type": "percentage", "value": 10 }
      ],
      "checkoutInputs": [
        {
          "id": "customer-name",
          "label": "Name",
          "type": "text",
          "required": true,
          "placeholder": "Enter your full name",
          "description": "The name of the person purchasing the arrangement.",
          "googleFormEntryId": "entry.1007473156"
        },
        {
          "id": "customer-phone",
          "label": "Phone",
          "type": "text",
          "required": true,
          "placeholder": "Enter your phone number",
          "description": "The phone number of the person purchasing the arrangement.",
          "googleFormEntryId": "entry.1090739960"
        },
        {
          "id": "pickup-date",
          "label": "Pick up Date and Time",
          "type": "text",
          "required": true,
          "googleFormEntryId": "entry.299847389"
        },
        {
          "id": "special-instructions",
          "label": "Special Instructions",
          "type": "textarea",
          "placeholder": "Any special requests or notes?",
          "googleFormEntryId": "entry.809680059"
        }
      ]
    }
  },
  sections: [

    // HERO
    {
      visible: true,
      id: "hero",
      type: "hero",
      eyebrow: "CM Florals • Floral Design • Gifts",
      title: "Floral Design and Gifts for Chicago's Suburbs",
      subtitle:
        "Custom florals for celebrations, weddings, holidays, and everyday gifting. Crafted with warmth and color to fit your story. Founded by Carole Murray.",
      primaryCta: { label: "Order Delivery Now", href: "#shop" },
      secondaryCta: {
        label: "Pick up at Ogilvie / Accenture Tower",
        href: "#contact",
      },
      imageUrl: logoMain.src,
    },

    // ✅ Product shop
    {
      visible: true,
      id: "shop",
      type: "productShop",
      title: "Shop Our Florals",
      subtitle: "Handcrafted florals — pickup at Ogilvie / Accenture Tower",
      bottomWaveType: "1-hill",
    },

        // CUSTOM FLORAL DESIGN REQUEST
    {
      visible: true,
      backgroundUrl: booth.src,
      id: "custom-request",
      type: "sendAMessage",
      title: "Custom Floral Design Request",
      subtitle: "Tell us about your event and we'll get back to you with a quote.",
      description: "Looking for something unique? Fill out the form below and Carole will personally follow up with a custom arrangement just for you.",
      submission: {
        type: "googleForm",
        formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfx9ZrZx8kIp_RKOH3Vmboozl0yrcUKqCQAMww1Q7hLsVQdIA/formResponse",
        fieldMap: {
          name:           "entry.547818426",
          email:          "entry.528578542",
          phone:          "entry.323794102",
          occasion:       "entry.118923852",
          "event-date":   "entry.778203591",
          budget:         "entry.1611030081",
          details:        "entry.447020428",
        },
      },
      submitLabel: "Send My Request",
      successTitle: "Request received!",
      successMessage: "Thank you! Carole will review your request and reach out within 1–2 business days.",
      fields: [
        { id: "name", label: "Your Name", type: "text", placeholder: "Full name", required: true },
        { id: "email", label: "Email Address", type: "email", placeholder: "your@email.com", required: true },
        { id: "phone", label: "Phone Number", type: "phone", placeholder: "(555) 555-5555" },
        {
          id: "occasion",
          label: "Occasion / Event Type",
          type: "select",
          required: true,
          options: ["Birthday", "Anniversary", "Wedding", "Corporate Event", "Prom", "Administrative Assistant Week", "Sympathy", "Just Because", "Other"],
        },
        { id: "event-date", label: "Event Date", type: "text", placeholder: "MM/DD/YYYY" },
        { id: "budget", label: "Approximate Budget", type: "text", placeholder: "e.g. $75–$150" },
        { id: "details", label: "Design Details & Special Requests", type: "textarea", placeholder: "Colors, flowers, style, size — anything that helps Carole craft the perfect arrangement.", required: true },
      ],
    },


    // WHAT WE CREATE
    {
      topWaveType: "1-hill",
      visible: true,
      id: "create",
      type: "features",
      title: "What we create",
      items: [
        {
          title: "Celebration & Event Florals",
          body:
            "Wedding parties, holidays, and special events — designed with warmth and color to fit your story.",
          imageUrl: flowertable.src,
        },
        {
          title: "Bouquets & Gifting",
          body:
            "Handcrafted bouquets and arrangements for friends and loved ones — same-day options available.",
          imageUrl: flowerwall.src,
        },
        {
          title: "Plants & Accents",
          body:
            "Potted plants, seasonal stems, and textural greenery to brighten homes and workplaces.",
          imageUrl: cart.src,
        },
      ],
    },

    {
      visible: true,
      id: "promo",
      type: "video",
      title: "Introducing CM Floral Design",
      subtitle: "",
      source: {
        type: "url",
        href: "https://youtu.be/w_Q4mTpHzog?si=lhWk_PGVBpehZIxs",
      },
      style: {
        aspect: "16/9",
        rounded: "xl",
        shadow: "lg",
        background: "default",
      },
      controls: true,
      autoplay: false,
      muted: false,
      loop: false,
    },

    {
      visible: true,
      id: "gallery",
      type: "gallery",
      title: "Previous Work",
      subtitle: "bouquets, gifts and event florals",
      style: { columns: 4, rounded: "xl", gap: "md" },
      backgroundClass: "bg-gradient-2",
      items: [
        { imageUrl: booth.src, alt: "Booth display" },
        { imageUrl: flowerwall3.src, alt: "Flower wall 3" },
        { imageUrl: flowerwall2.src, alt: "Flower wall 2" },

        { imageUrl: flower8.src, alt: "Arrangement 7" },

        { imageUrl: flower2.src, alt: "Arrangement 1" },

        { imageUrl: flower3.src, alt: "Arrangement 2" },
        { imageUrl: flower4.src, alt: "Arrangement 3" },
        { imageUrl: flower5.src, alt: "Arrangement 4" },
        { imageUrl: flower6.src, alt: "Arrangement 5" },
        { imageUrl: flower7.src, alt: "Arrangement 6" },

        { imageUrl: flower11.src, alt: "Arrangement 11" },
        { imageUrl: flower9.src, alt: "Arrangement 9" },
        { imageUrl: logo2.src, alt: "Arrangement 0" },
        { imageUrl: flower10.src, alt: "Arrangement 10" },
        { imageUrl: fallDecor1.src, alt: "fall decor" },
        { imageUrl: fallDecor2.src, alt: "fall decor alt" },
        { imageUrl: flowerwall.src, alt: "Flower wall" },

        { imageUrl: flowertable2.src, alt: "Table setup" },
      ],
      bottomWaveType: "1-hill",
    },

    {
      visible: true,
      id: "floating",
      type: "sectional",
      title: "Bringing sunshine and smiles to Chicago",
      body: "Floral design that brings joy to everyday life.",
      backgroundUrl: booth.src,
      overlay: true,
      height: "md",
    },

    // TESTIMONIALS
    {
      visible: true,
      id: "testimonials",
      type: "testimonials",
      title: "What Customers Experience",
      topWaveType: "1-hill",
      bottomWaveType: "1-hill",
      subtitle:
        "We strive to help our cusomters connect with loved ones through the art of gift giving.",
      items: [
        {
          quote:
            "Carole is true artist! Even in a pinch, she arranges the most beautiful combination of flowers and colors, making every bouquet lovely and truly unique. Her flowers are fresh and long-lasting. CM is our go-to!",
          name: "Maggie Ghobrial",
          role: "Customer",
          avatarUrl: review1.src,
        },

        {
          quote:
            "Carole makes amazing bouquets! My girlfriend loves them ❤️❤️❤️❤️",
          name: "Arnav Sinha",
          role: "Customer",
        },
        {
          quote:
            "The Love and care that Carole puts into her bouquets is apparent from their beauty, creativeness, and quality! You can expect exactly what she promises, gorgeous and creative mastery of the art of florals through decades of experience!",
          name: "Nick Stricker",
          role: "Customer & Business Partner",
          avatarUrl: review2.src,
        },
        {
          quote:
            "I know very little about flowers, but I said it's my wife's birthday, I said she likes hydrangeas, set my budget, and I received an absolutely stunning bouquet a few minutes later. My wife loves them! I'm so thankful that we UP commuters have such a gifted florist at OTC!",
          name: "Jonathan Walker",
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

    // ABOUT FOUNDER
    {
      visible: true,
      id: "about",
      type: "about",
      title: "About the Founder — Carole Murray",
      body:
        "Grew up in the Chicago suburbs, inspired by the natural prairie fields of Illinois. I have worked in the Chicago floral industry for 45 years — from neighborhood shops to destination assignments in Las Vegas and Hawaii. I love training beginners and getting them excited to enter the world of floral design. I look at life as an opportunity to make people smile.",
      imageUrl: carole.src,
      backgroundClass: "bg-gradient-1",
    },

    {
      visible: true,
      id: "socials",
      type: "socials",
      title: "Connect With Me",
      subtitle: "Want to collaborate? Follow or message me.",
      items: [
        { type: "instagram", href: instagramHref, label: "Instagram" },
        { type: "tiktok", href: tiktokHref, label: "TikTok" },
        { type: "facebook", href: facebookHref, label: "Facebook" },
        { type: "linkedin", href: linkedinHref, label: "LinkedIn" },
      ],
      style: {
        background: "band",
        rounded: "xl",
        size: "lg",
        gap: "md",
        align: "center",
      },
    },

    {
      visible: true,
      id: "book",
      type: "cta",
      title: "Ready to start?",
      body: "Text or call to set up your event space.",
      cta: { label: "Call Now", href: phoneHref },
    },

    // CONTACT

    {
      visible: true,
      id: "contact",
      type: "contact",
      title: "How to Find Us",
      email: "shop@cmfloralsandgifts.com",
      address: "Ogilvie / Accenture Tower, 500 W Madison St, Chicago, IL 60661",
      phone: { label: "(773) 209-4805", href: phoneHref },
      backgroundUrl: booth.src,
      mapEmbedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2970.4544466085986!2d-87.64308727391516!3d41.8830827712412!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880e2cc71c0b855f%3A0xb098c28fb3a60491!2sOgilvie%20Transportation%20Center!5e0!3m2!1sen!2sus!4v1757250851078!5m2!1sen!2sus",
      socials: [
        { label: "LinkedIn", href: linkedinHref },
        { label: "TikTok", href: tiktokHref },
        { label: "Instagram", href: instagramHref },
        { label: "Facebook", href: facebookHref },
      ],
    },

    {
      visible: true,
      id: "pay",
      type: "cta",
      title: "Want to complete an order or make a payment?",
      body: "Visit our Venmo page to complete your transaction.",
      cta: { label: "Pay Now", href: "https://venmo.com/u/Carole-Murray-9" },
    },

    // SHARE (QR)
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
          { label: "Home", href: "/" },
          { label: "Shop", href: "#shop" },
          { label: "Custom Request", href: "#custom-request" },
          { label: "About", href: "#create" },
          { label: "Founder", href: "#about" },
          { label: "Previous Work", href: "#gallery" },
          { label: "Testimonials", href: "#testimonials" },
          { label: "Contact", href: "#contact" },
        ],
      },
      {
        title: "Info",
        links: [
          { label: "CM Florals & Gifts", href: "/" },
          {
            label: "500 W Madison St, Chicago, IL 60661",
            href: "https://maps.app.goo.gl/uHEar2C6fxQPoHUo6",
          },
          { label: "(773) 209-4805", href: phoneHref },
          { label: "Hours: Mon–Fri 9am–5pm", href: "#" },
        ],
      },
      {
        title: "Connect",
        links: [
          {
            label: "shop@cmfloralsandgifts.com",
            href: "mailto:shop@cmfloralsandgifts.com",
          },
          { label: "Instagram", href: instagramHref },
          { label: "TikTok", href: tiktokHref },
          { label: "LinkedIn", href: linkedinHref },
        ],
      },
    ],
    legal: "© 2025 CM Florals. All rights reserved.",
  },
};
