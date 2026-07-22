// ---------------------------------------------------------------------------
// SAMPLE PRODUCT CATALOG — demo data only.
// This is a static, illustrative dataset for a design preview. It does NOT
// represent real products, prices, stock, or telemetry from any retailer.
// Images are generated monochrome silhouettes (see components/ProductImage).
// ---------------------------------------------------------------------------

export type Category =
  | "AUDIO"
  | "MOBILE"
  | "COMPUTE"
  | "WEARABLE"
  | "HOME"
  | "POWER";

export type Silhouette =
  | "headphone"
  | "earbud"
  | "phone"
  | "laptop"
  | "watch"
  | "speaker"
  | "keyboard"
  | "camera"
  | "battery"
  | "bulb"
  | "mouse"
  | "tablet";

export interface Product {
  id: string;
  title: string;
  /** Price in whole USD. */
  price: number;
  /** 0.0 – 5.0, one decimal. */
  rating: number;
  /** Number of sample reviews backing the rating. */
  reviews: number;
  category: Category;
  silhouette: Silhouette;
  /** Units of demo stock remaining. */
  stock: number;
  /** Delivery estimate in days. */
  etaDays: number;
  /** Short spec bullets shown on the detail screen. */
  specs: string[];
  blurb: string;
}

export const CATEGORIES: Category[] = [
  "AUDIO",
  "MOBILE",
  "COMPUTE",
  "WEARABLE",
  "HOME",
  "POWER",
];

export const PRODUCTS: Product[] = [
  {
    id: "nd-ear-1",
    title: "MONO EAR (1) TRANSPARENT",
    price: 149,
    rating: 4.6,
    reviews: 2841,
    category: "AUDIO",
    silhouette: "earbud",
    stock: 42,
    etaDays: 2,
    specs: ["ANC 42DB", "8H / 30H CASE", "DUAL DRIVER", "IP54"],
    blurb: "Transparent-shell wireless earbuds tuned for flat, honest sound.",
  },
  {
    id: "nd-over-2",
    title: "OVER-EAR HEADSET STUDIO",
    price: 299,
    rating: 4.8,
    reviews: 1120,
    category: "AUDIO",
    silhouette: "headphone",
    stock: 12,
    etaDays: 3,
    specs: ["40MM DRIVER", "80H BATTERY", "LDAC", "MEMORY FOAM"],
    blurb: "Reference over-ear cans with a segmented aluminium headband.",
  },
  {
    id: "nd-spk-3",
    title: "BRICK SPEAKER 360",
    price: 179,
    rating: 4.3,
    reviews: 640,
    category: "AUDIO",
    silhouette: "speaker",
    stock: 0,
    etaDays: 7,
    specs: ["360° SOUND", "IP67", "24H PLAY", "USB-C"],
    blurb: "A monolithic portable speaker with mechanical volume dial.",
  },
  {
    id: "nd-phone-1",
    title: "PHONE (2) GLYPH EDITION",
    price: 699,
    rating: 4.7,
    reviews: 5230,
    category: "MOBILE",
    silhouette: "phone",
    stock: 8,
    etaDays: 2,
    specs: ['6.7" OLED 120HZ', "50MP DUAL", "4700MAH", "GLYPH UI"],
    blurb: "Transparent-back handset with a rear dot-matrix interface.",
  },
  {
    id: "nd-phone-2",
    title: "PHONE (2A) COMPACT",
    price: 349,
    rating: 4.5,
    reviews: 3110,
    category: "MOBILE",
    silhouette: "phone",
    stock: 31,
    etaDays: 2,
    specs: ['6.5" OLED', "50MP", "5000MAH", "GLYPH MINI"],
    blurb: "The compact, value-tuned member of the handset line.",
  },
  {
    id: "nd-tab-1",
    title: "SLATE TABLET 11",
    price: 549,
    rating: 4.2,
    reviews: 410,
    category: "MOBILE",
    silhouette: "tablet",
    stock: 15,
    etaDays: 4,
    specs: ['11" LCD 144HZ', "8GB RAM", "256GB", "STYLUS READY"],
    blurb: "A flat, borderless slate for reading and sketching.",
  },
  {
    id: "nd-lap-1",
    title: "COMPUTE BOOK 14 CARBON",
    price: 1299,
    rating: 4.6,
    reviews: 890,
    category: "COMPUTE",
    silhouette: "laptop",
    stock: 6,
    etaDays: 5,
    specs: ['14" 3K', "16GB / 1TB", "18H BATTERY", "1.1KG"],
    blurb: "A featherweight carbon notebook with mechanical hinge.",
  },
  {
    id: "nd-kbd-1",
    title: "MECH KEYBOARD 75",
    price: 159,
    rating: 4.9,
    reviews: 2260,
    category: "COMPUTE",
    silhouette: "keyboard",
    stock: 54,
    etaDays: 3,
    specs: ["75% LAYOUT", "HOT-SWAP", "GASKET", "PBT CAPS"],
    blurb: "A tactile hot-swap board with exposed switch plate.",
  },
  {
    id: "nd-mouse-1",
    title: "PRECISION MOUSE LITE",
    price: 79,
    rating: 4.1,
    reviews: 980,
    category: "COMPUTE",
    silhouette: "mouse",
    stock: 27,
    etaDays: 2,
    specs: ["26K DPI", "45G", "8K POLL", "USB-C"],
    blurb: "An ultralight symmetric mouse with segmented scroll wheel.",
  },
  {
    id: "nd-watch-1",
    title: "WATCH PRO INSTRUMENT",
    price: 249,
    rating: 4.4,
    reviews: 1730,
    category: "WEARABLE",
    silhouette: "watch",
    stock: 19,
    etaDays: 3,
    specs: ['1.4" AMOLED', "14D BATTERY", "GPS DUAL", "5ATM"],
    blurb: "An instrument-dial smartwatch with tick-mark bezel.",
  },
  {
    id: "nd-watch-2",
    title: "WATCH BAND SEGMENT SET",
    price: 39,
    rating: 4.0,
    reviews: 520,
    category: "WEARABLE",
    silhouette: "watch",
    stock: 88,
    etaDays: 2,
    specs: ["FLUORO RUBBER", "QUICK RELEASE", "3 SIZES", "MONOCHROME"],
    blurb: "Replacement bands in a strictly monochrome palette.",
  },
  {
    id: "nd-cam-1",
    title: "POCKET CAMERA MONO",
    price: 429,
    rating: 4.3,
    reviews: 300,
    category: "WEARABLE",
    silhouette: "camera",
    stock: 4,
    etaDays: 6,
    specs: ["1IN SENSOR", "4K60", "GIMBAL", "POCKET SIZE"],
    blurb: "A pocket gimbal camera with monochrome film modes.",
  },
  {
    id: "nd-bulb-1",
    title: "SMART BULB MATRIX",
    price: 29,
    rating: 4.2,
    reviews: 1440,
    category: "HOME",
    silhouette: "bulb",
    stock: 120,
    etaDays: 2,
    specs: ["1600LM", "MATTER", "TUNABLE WHITE", "16M COLOR"],
    blurb: "A tunable smart bulb controlled from the instrument app.",
  },
  {
    id: "nd-bulb-2",
    title: "LIGHT STRIP GRID 5M",
    price: 49,
    rating: 4.1,
    reviews: 760,
    category: "HOME",
    silhouette: "bulb",
    stock: 63,
    etaDays: 3,
    specs: ["5 METRE", "MATTER", "ADDRESSABLE", "USB-C"],
    blurb: "An addressable light strip with a dot-grid diffuser.",
  },
  {
    id: "nd-home-hub",
    title: "HOME HUB PANEL",
    price: 129,
    rating: 4.0,
    reviews: 210,
    category: "HOME",
    silhouette: "tablet",
    stock: 22,
    etaDays: 4,
    specs: ['7" PANEL', "MATTER", "THREAD", "SPEAKER"],
    blurb: "A wall panel that mirrors the instrument dashboard.",
  },
  {
    id: "nd-pwr-1",
    title: "POWER BANK 20K SLAB",
    price: 69,
    rating: 4.5,
    reviews: 3400,
    category: "POWER",
    silhouette: "battery",
    stock: 47,
    etaDays: 2,
    specs: ["20000MAH", "100W USB-C", "DOT READOUT", "PASS-THRU"],
    blurb: "A flat power slab with a segmented charge readout.",
  },
  {
    id: "nd-pwr-2",
    title: "GAN CHARGER 140W",
    price: 89,
    rating: 4.6,
    reviews: 1980,
    category: "POWER",
    silhouette: "battery",
    stock: 33,
    etaDays: 2,
    specs: ["140W", "3 PORT", "GAN III", "FOLDABLE PIN"],
    blurb: "A compact GaN charger that powers a full desk setup.",
  },
  {
    id: "nd-pwr-3",
    title: "CABLE SET BRAIDED",
    price: 19,
    rating: 3.9,
    reviews: 890,
    category: "POWER",
    silhouette: "battery",
    stock: 210,
    etaDays: 1,
    specs: ["3 PACK", "240W", "1M / 2M", "BRAIDED"],
    blurb: "Braided USB-C cables rated for the full charger line.",
  },
  {
    id: "nd-audio-dac",
    title: "PORTABLE DAC STICK",
    price: 119,
    rating: 4.7,
    reviews: 540,
    category: "AUDIO",
    silhouette: "battery",
    stock: 17,
    etaDays: 3,
    specs: ["32BIT / 384K", "DUAL DAC", "3.5 + 4.4MM", "USB-C"],
    blurb: "A pocket DAC/amp with an exposed component board.",
  },
  {
    id: "nd-watch-charger",
    title: "DOCK CHARGER TRIPLE",
    price: 99,
    rating: 4.2,
    reviews: 260,
    category: "POWER",
    silhouette: "battery",
    stock: 9,
    etaDays: 4,
    specs: ["3-IN-1", "MAGNETIC", "15W", "ALUMINIUM"],
    blurb: "A machined dock that charges phone, watch and buds.",
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
