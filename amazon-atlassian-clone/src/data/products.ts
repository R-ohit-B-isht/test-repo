// SAMPLE DATA — illustrative demo catalog only. These are fictional products with
// made-up prices and ratings, NOT real telemetry or real-brand data. Used to
// demonstrate the Atlassian-styled storefront UI.

export type Category =
  | 'Electronics'
  | 'Home & kitchen'
  | 'Books'
  | 'Sports & outdoors'
  | 'Toys & games'

export type Stock = 'in-stock' | 'low-stock' | 'out-of-stock'

export interface Product {
  id: string
  title: string
  category: Category
  price: number
  listPrice?: number
  rating: number // 0..5
  ratingCount: number
  stock: Stock
  deliveryDays: number
  prime: boolean
  description: string
  specs: { label: string; value: string }[]
  /** silhouette shape key for the generated placeholder image */
  shape: 'headphones' | 'laptop' | 'mug' | 'book' | 'shoe' | 'ball' | 'controller' | 'camera' | 'watch' | 'blender'
}

export const CATEGORIES: Category[] = [
  'Electronics',
  'Home & kitchen',
  'Books',
  'Sports & outdoors',
  'Toys & games',
]

export const products: Product[] = [
  {
    id: 'p01',
    title: 'Aurora wireless over-ear headphones',
    category: 'Electronics',
    price: 129.99,
    listPrice: 179.99,
    rating: 4.6,
    ratingCount: 2841,
    stock: 'in-stock',
    deliveryDays: 1,
    prime: true,
    description:
      'Active noise cancellation, 40-hour battery, and plush memory-foam ear cushions for all-day comfort.',
    specs: [
      { label: 'Connectivity', value: 'Bluetooth 5.3' },
      { label: 'Battery life', value: '40 hours' },
      { label: 'Weight', value: '254 g' },
      { label: 'Noise cancelling', value: 'Adaptive ANC' },
    ],
    shape: 'headphones',
  },
  {
    id: 'p02',
    title: 'Meridian 14" ultralight laptop',
    category: 'Electronics',
    price: 899.0,
    listPrice: 1049.0,
    rating: 4.4,
    ratingCount: 1203,
    stock: 'low-stock',
    deliveryDays: 2,
    prime: true,
    description:
      'A 1.1 kg magnesium chassis, 18-hour battery, and a crisp 2.8K display for work anywhere.',
    specs: [
      { label: 'Processor', value: '8-core, 3.4 GHz' },
      { label: 'Memory', value: '16 GB' },
      { label: 'Storage', value: '512 GB SSD' },
      { label: 'Display', value: '14" 2.8K OLED' },
    ],
    shape: 'laptop',
  },
  {
    id: 'p03',
    title: 'Terra double-wall ceramic mug (set of 4)',
    category: 'Home & kitchen',
    price: 34.5,
    rating: 4.8,
    ratingCount: 5120,
    stock: 'in-stock',
    deliveryDays: 3,
    prime: false,
    description: 'Keeps drinks warm longer with a double-wall design. Dishwasher and microwave safe.',
    specs: [
      { label: 'Capacity', value: '350 ml' },
      { label: 'Material', value: 'Stoneware ceramic' },
      { label: 'Set includes', value: '4 mugs' },
    ],
    shape: 'mug',
  },
  {
    id: 'p04',
    title: 'The Quiet Algorithm — a novel',
    category: 'Books',
    price: 14.99,
    listPrice: 19.99,
    rating: 4.2,
    ratingCount: 876,
    stock: 'in-stock',
    deliveryDays: 2,
    prime: true,
    description: 'A best-selling story about a programmer who discovers a pattern that reshapes a city.',
    specs: [
      { label: 'Format', value: 'Paperback' },
      { label: 'Pages', value: '384' },
      { label: 'Language', value: 'English' },
    ],
    shape: 'book',
  },
  {
    id: 'p05',
    title: 'Trailhead all-terrain running shoes',
    category: 'Sports & outdoors',
    price: 89.95,
    rating: 4.5,
    ratingCount: 3402,
    stock: 'in-stock',
    deliveryDays: 1,
    prime: true,
    description: 'Responsive foam midsole and grippy outsole built for road-to-trail transitions.',
    specs: [
      { label: 'Drop', value: '8 mm' },
      { label: 'Weight', value: '272 g' },
      { label: 'Upper', value: 'Recycled mesh' },
    ],
    shape: 'shoe',
  },
  {
    id: 'p06',
    title: 'Rally match soccer ball (size 5)',
    category: 'Sports & outdoors',
    price: 24.99,
    rating: 4.3,
    ratingCount: 1540,
    stock: 'low-stock',
    deliveryDays: 4,
    prime: false,
    description: 'Machine-stitched panels and a butyl bladder for consistent bounce and air retention.',
    specs: [
      { label: 'Size', value: '5 (official)' },
      { label: 'Material', value: 'Thermal-bonded PU' },
    ],
    shape: 'ball',
  },
  {
    id: 'p07',
    title: 'Pixel Quest wireless game controller',
    category: 'Toys & games',
    price: 54.99,
    listPrice: 69.99,
    rating: 4.7,
    ratingCount: 4210,
    stock: 'in-stock',
    deliveryDays: 1,
    prime: true,
    description: 'Low-latency 2.4 GHz mode, hall-effect sticks, and a 20-hour rechargeable battery.',
    specs: [
      { label: 'Connectivity', value: '2.4 GHz + Bluetooth' },
      { label: 'Battery', value: '20 hours' },
      { label: 'Compatibility', value: 'PC, mobile, console' },
    ],
    shape: 'controller',
  },
  {
    id: 'p08',
    title: 'Lumen 4K mirrorless camera body',
    category: 'Electronics',
    price: 1299.0,
    rating: 4.6,
    ratingCount: 612,
    stock: 'out-of-stock',
    deliveryDays: 7,
    prime: false,
    description: '26 MP sensor with in-body stabilization and 4K/60 video for creators.',
    specs: [
      { label: 'Sensor', value: '26 MP APS-C' },
      { label: 'Stabilization', value: '5-axis IBIS' },
      { label: 'Video', value: '4K / 60 fps' },
    ],
    shape: 'camera',
  },
  {
    id: 'p09',
    title: 'Pulse fitness smartwatch',
    category: 'Electronics',
    price: 199.0,
    listPrice: 249.0,
    rating: 4.1,
    ratingCount: 2098,
    stock: 'in-stock',
    deliveryDays: 2,
    prime: true,
    description: 'Continuous heart-rate, GPS, and a 7-day battery in a lightweight aluminum case.',
    specs: [
      { label: 'Display', value: '1.4" AMOLED' },
      { label: 'Battery', value: 'Up to 7 days' },
      { label: 'Water rating', value: '5 ATM' },
    ],
    shape: 'watch',
  },
  {
    id: 'p10',
    title: 'Vortex high-speed countertop blender',
    category: 'Home & kitchen',
    price: 119.99,
    rating: 4.4,
    ratingCount: 1876,
    stock: 'low-stock',
    deliveryDays: 3,
    prime: false,
    description: 'A 1200-watt motor and stainless blades crush ice and frozen fruit in seconds.',
    specs: [
      { label: 'Power', value: '1200 W' },
      { label: 'Jar', value: '1.8 L Tritan' },
      { label: 'Programs', value: '5 presets' },
    ],
    shape: 'blender',
  },
  {
    id: 'p11',
    title: 'Aurora Mini true-wireless earbuds',
    category: 'Electronics',
    price: 69.99,
    listPrice: 89.99,
    rating: 4.0,
    ratingCount: 3311,
    stock: 'in-stock',
    deliveryDays: 1,
    prime: true,
    description: 'Compact earbuds with 28-hour combined battery and a pocketable charging case.',
    specs: [
      { label: 'Battery', value: '28 h with case' },
      { label: 'Drivers', value: '10 mm dynamic' },
      { label: 'Water rating', value: 'IPX4' },
    ],
    shape: 'headphones',
  },
  {
    id: 'p12',
    title: 'Field Notes: a designer’s handbook',
    category: 'Books',
    price: 22.0,
    rating: 4.9,
    ratingCount: 1440,
    stock: 'in-stock',
    deliveryDays: 2,
    prime: true,
    description: 'A concise, opinionated guide to systems, tokens, and building calm interfaces.',
    specs: [
      { label: 'Format', value: 'Hardcover' },
      { label: 'Pages', value: '256' },
      { label: 'Language', value: 'English' },
    ],
    shape: 'book',
  },
  {
    id: 'p13',
    title: 'Summit insulated travel mug',
    category: 'Home & kitchen',
    price: 27.99,
    rating: 4.5,
    ratingCount: 2760,
    stock: 'in-stock',
    deliveryDays: 2,
    prime: true,
    description: 'Vacuum-insulated stainless steel keeps drinks hot for 12 hours, cold for 24.',
    specs: [
      { label: 'Capacity', value: '500 ml' },
      { label: 'Insulation', value: 'Double-wall vacuum' },
    ],
    shape: 'mug',
  },
  {
    id: 'p14',
    title: 'Cobalt court basketball (size 7)',
    category: 'Sports & outdoors',
    price: 29.99,
    rating: 4.2,
    ratingCount: 990,
    stock: 'in-stock',
    deliveryDays: 3,
    prime: false,
    description: 'Composite leather cover with deep channels for confident grip indoors and out.',
    specs: [
      { label: 'Size', value: '7 (official)' },
      { label: 'Surface', value: 'Indoor / outdoor' },
    ],
    shape: 'ball',
  },
  {
    id: 'p15',
    title: 'Meridian Pro 16" creator laptop',
    category: 'Electronics',
    price: 1699.0,
    listPrice: 1899.0,
    rating: 4.7,
    ratingCount: 428,
    stock: 'low-stock',
    deliveryDays: 2,
    prime: true,
    description: 'A color-accurate 16" display, 32 GB memory, and a discrete GPU for heavy workloads.',
    specs: [
      { label: 'Processor', value: '12-core, 4.0 GHz' },
      { label: 'Memory', value: '32 GB' },
      { label: 'Storage', value: '1 TB SSD' },
      { label: 'Display', value: '16" 3K mini-LED' },
    ],
    shape: 'laptop',
  },
  {
    id: 'p16',
    title: 'Pixel Quest retro handheld console',
    category: 'Toys & games',
    price: 89.0,
    rating: 4.3,
    ratingCount: 1712,
    stock: 'in-stock',
    deliveryDays: 1,
    prime: true,
    description: 'A 5" IPS screen, programmable buttons, and hours of pick-up-and-play fun.',
    specs: [
      { label: 'Display', value: '5" IPS 720p' },
      { label: 'Battery', value: '8 hours' },
    ],
    shape: 'controller',
  },
  {
    id: 'p17',
    title: 'Lumen compact instant camera',
    category: 'Electronics',
    price: 79.99,
    rating: 4.1,
    ratingCount: 2033,
    stock: 'in-stock',
    deliveryDays: 2,
    prime: true,
    description: 'Prints credit-card-sized photos instantly with a built-in selfie mirror.',
    specs: [
      { label: 'Film', value: 'Instant mini' },
      { label: 'Flash', value: 'Auto' },
    ],
    shape: 'camera',
  },
  {
    id: 'p18',
    title: 'Pulse Lite everyday smartwatch',
    category: 'Electronics',
    price: 129.0,
    rating: 4.0,
    ratingCount: 1450,
    stock: 'in-stock',
    deliveryDays: 2,
    prime: false,
    description: 'Notifications, sleep tracking, and a 10-day battery in a slim, light case.',
    specs: [
      { label: 'Display', value: '1.2" AMOLED' },
      { label: 'Battery', value: 'Up to 10 days' },
    ],
    shape: 'watch',
  },
  {
    id: 'p19',
    title: 'Vortex personal blender (portable)',
    category: 'Home & kitchen',
    price: 44.99,
    listPrice: 59.99,
    rating: 4.2,
    ratingCount: 3120,
    stock: 'in-stock',
    deliveryDays: 1,
    prime: true,
    description: 'USB-C rechargeable blender that makes single-serve smoothies on the go.',
    specs: [
      { label: 'Jar', value: '450 ml' },
      { label: 'Charging', value: 'USB-C' },
    ],
    shape: 'blender',
  },
  {
    id: 'p20',
    title: 'Trailhead trail-running vest',
    category: 'Sports & outdoors',
    price: 64.99,
    rating: 4.6,
    ratingCount: 720,
    stock: 'low-stock',
    deliveryDays: 3,
    prime: false,
    description: 'A 5-litre hydration vest with bounce-free fit and quick-access front pockets.',
    specs: [
      { label: 'Capacity', value: '5 L' },
      { label: 'Fit', value: 'Adjustable sternum' },
    ],
    shape: 'shoe',
  },
]

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}
