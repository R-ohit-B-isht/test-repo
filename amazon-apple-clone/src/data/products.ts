/*
  SAMPLE DATA — illustrative demo catalog only.
  These are fictional products with made-up prices/ratings for a UI demo.
  They are NOT real listings and contain no real-brand telemetry.
*/

export type Category =
  | 'Electronics'
  | 'Home'
  | 'Audio'
  | 'Wearables'
  | 'Gaming'
  | 'Accessories'

export type Product = {
  id: string
  title: string
  /** price in USD */
  price: number
  /** optional strikethrough list price for "deal" moments */
  listPrice?: number
  /** average rating 0–5 */
  rating: number
  reviews: number
  category: Category
  /** neutral hue used by the generated placeholder silhouette */
  hue: number
  shape: 'box' | 'circle' | 'device' | 'bottle' | 'headphone'
  inStock: boolean
  fastDelivery: boolean
  description: string
  specs: { label: string; value: string }[]
}

export const products: Product[] = [
  {
    id: 'aurora-headphones',
    title: 'Aurora Wireless Headphones',
    price: 199,
    listPrice: 279,
    rating: 4.7,
    reviews: 2841,
    category: 'Audio',
    hue: 210,
    shape: 'headphone',
    inStock: true,
    fastDelivery: true,
    description:
      'Over-ear active noise cancellation with adaptive transparency and up to 30 hours of listening.',
    specs: [
      { label: 'Battery', value: '30 hrs' },
      { label: 'Connectivity', value: 'Bluetooth 5.3' },
      { label: 'Weight', value: '254 g' },
      { label: 'Noise Cancellation', value: 'Adaptive' },
    ],
  },
  {
    id: 'lumen-smart-bulb',
    title: 'Lumen Smart Bulb (4-Pack)',
    price: 39,
    listPrice: 59,
    rating: 4.4,
    reviews: 1203,
    category: 'Home',
    hue: 40,
    shape: 'circle',
    inStock: true,
    fastDelivery: true,
    description:
      'Color-tunable LED bulbs with schedules and voice control. Warm to daylight white plus 16M colors.',
    specs: [
      { label: 'Brightness', value: '800 lm' },
      { label: 'Base', value: 'E26' },
      { label: 'Lifespan', value: '25,000 hrs' },
      { label: 'Control', value: 'App / Voice' },
    ],
  },
  {
    id: 'pulse-smartwatch',
    title: 'Pulse Fitness Smartwatch',
    price: 249,
    rating: 4.6,
    reviews: 5120,
    category: 'Wearables',
    hue: 150,
    shape: 'device',
    inStock: true,
    fastDelivery: true,
    description:
      'GPS, heart-rate and blood-oxygen tracking with a bright always-on display and 7-day battery.',
    specs: [
      { label: 'Display', value: '1.9" OLED' },
      { label: 'Battery', value: '7 days' },
      { label: 'Water Resistance', value: '50 m' },
      { label: 'Sensors', value: 'HR · SpO₂ · GPS' },
    ],
  },
  {
    id: 'nimbus-tablet',
    title: 'Nimbus 11" Tablet',
    price: 429,
    listPrice: 499,
    rating: 4.5,
    reviews: 934,
    category: 'Electronics',
    hue: 250,
    shape: 'device',
    inStock: true,
    fastDelivery: false,
    description:
      'Lightweight 11-inch tablet with a laminated display, all-day battery and optional keyboard folio.',
    specs: [
      { label: 'Display', value: '11" Liquid' },
      { label: 'Storage', value: '128 GB' },
      { label: 'Battery', value: '10 hrs' },
      { label: 'Weight', value: '466 g' },
    ],
  },
  {
    id: 'echo-earbuds',
    title: 'Echo Pro Earbuds',
    price: 129,
    listPrice: 179,
    rating: 4.3,
    reviews: 3402,
    category: 'Audio',
    hue: 190,
    shape: 'circle',
    inStock: true,
    fastDelivery: true,
    description:
      'Compact true-wireless earbuds with spatial audio, sweat resistance and a pocketable charging case.',
    specs: [
      { label: 'Battery', value: '6 + 24 hrs' },
      { label: 'Audio', value: 'Spatial' },
      { label: 'Resistance', value: 'IPX4' },
      { label: 'Case', value: 'USB-C' },
    ],
  },
  {
    id: 'terra-blender',
    title: 'Terra High-Speed Blender',
    price: 89,
    rating: 4.2,
    reviews: 767,
    category: 'Home',
    hue: 20,
    shape: 'bottle',
    inStock: true,
    fastDelivery: false,
    description:
      'A 1200-watt blender with stainless blades and preset programs for smoothies, soups and ice.',
    specs: [
      { label: 'Power', value: '1200 W' },
      { label: 'Capacity', value: '1.8 L' },
      { label: 'Programs', value: '5' },
      { label: 'Material', value: 'Tritan' },
    ],
  },
  {
    id: 'vertex-controller',
    title: 'Vertex Wireless Controller',
    price: 59,
    listPrice: 69,
    rating: 4.6,
    reviews: 4210,
    category: 'Gaming',
    hue: 280,
    shape: 'device',
    inStock: true,
    fastDelivery: true,
    description:
      'Low-latency wireless controller with textured grips, mappable back buttons and haptic triggers.',
    specs: [
      { label: 'Battery', value: '40 hrs' },
      { label: 'Latency', value: '<10 ms' },
      { label: 'Connectivity', value: '2.4 GHz / BT' },
      { label: 'Buttons', value: 'Mappable' },
    ],
  },
  {
    id: 'harbor-speaker',
    title: 'Harbor Portable Speaker',
    price: 79,
    rating: 4.5,
    reviews: 1988,
    category: 'Audio',
    hue: 340,
    shape: 'bottle',
    inStock: false,
    fastDelivery: false,
    description:
      'Waterproof portable speaker with 360° sound, 20-hour battery and stereo pairing.',
    specs: [
      { label: 'Battery', value: '20 hrs' },
      { label: 'Resistance', value: 'IP67' },
      { label: 'Sound', value: '360°' },
      { label: 'Weight', value: '540 g' },
    ],
  },
  {
    id: 'flux-charger',
    title: 'Flux 3-in-1 Charging Stand',
    price: 69,
    listPrice: 99,
    rating: 4.4,
    reviews: 655,
    category: 'Accessories',
    hue: 210,
    shape: 'box',
    inStock: true,
    fastDelivery: true,
    description:
      'Charge phone, watch and earbuds at once on a compact aluminum stand with fast wireless coils.',
    specs: [
      { label: 'Output', value: '15 W' },
      { label: 'Ports', value: '3-in-1' },
      { label: 'Material', value: 'Aluminum' },
      { label: 'Cable', value: 'USB-C' },
    ],
  },
  {
    id: 'atlas-backpack',
    title: 'Atlas Commuter Backpack',
    price: 119,
    rating: 4.7,
    reviews: 1420,
    category: 'Accessories',
    hue: 30,
    shape: 'box',
    inStock: true,
    fastDelivery: false,
    description:
      'Water-resistant commuter backpack with a padded 16" laptop sleeve and hidden security pocket.',
    specs: [
      { label: 'Capacity', value: '22 L' },
      { label: 'Laptop', value: 'Up to 16"' },
      { label: 'Material', value: 'Recycled' },
      { label: 'Weight', value: '820 g' },
    ],
  },
  {
    id: 'orbit-mouse',
    title: 'Orbit Ergonomic Mouse',
    price: 49,
    listPrice: 59,
    rating: 4.1,
    reviews: 512,
    category: 'Accessories',
    hue: 200,
    shape: 'circle',
    inStock: true,
    fastDelivery: true,
    description:
      'Silent-click ergonomic wireless mouse with adjustable DPI and a rechargeable battery.',
    specs: [
      { label: 'DPI', value: 'Up to 4000' },
      { label: 'Battery', value: '70 days' },
      { label: 'Buttons', value: '6' },
      { label: 'Connectivity', value: 'BT / 2.4 GHz' },
    ],
  },
  {
    id: 'quartz-monitor',
    title: 'Quartz 27" 4K Monitor',
    price: 349,
    listPrice: 429,
    rating: 4.6,
    reviews: 880,
    category: 'Electronics',
    hue: 230,
    shape: 'device',
    inStock: true,
    fastDelivery: false,
    description:
      'A 27-inch 4K IPS display with 99% sRGB, USB-C power delivery and a height-adjustable stand.',
    specs: [
      { label: 'Resolution', value: '3840×2160' },
      { label: 'Panel', value: 'IPS' },
      { label: 'Refresh', value: '60 Hz' },
      { label: 'Ports', value: 'USB-C · HDMI' },
    ],
  },
  {
    id: 'breeze-fan',
    title: 'Breeze Tower Fan',
    price: 99,
    rating: 4.3,
    reviews: 430,
    category: 'Home',
    hue: 170,
    shape: 'bottle',
    inStock: true,
    fastDelivery: true,
    description:
      'Bladeless tower fan with oscillation, a sleep timer and a quiet night mode.',
    specs: [
      { label: 'Speeds', value: '10' },
      { label: 'Noise', value: '35 dB' },
      { label: 'Timer', value: '8 hrs' },
      { label: 'Remote', value: 'Yes' },
    ],
  },
  {
    id: 'summit-keyboard',
    title: 'Summit Mechanical Keyboard',
    price: 139,
    listPrice: 159,
    rating: 4.8,
    reviews: 2110,
    category: 'Gaming',
    hue: 300,
    shape: 'box',
    inStock: true,
    fastDelivery: true,
    description:
      'Hot-swappable mechanical keyboard with per-key lighting, a gasket mount and PBT keycaps.',
    specs: [
      { label: 'Switches', value: 'Hot-swap' },
      { label: 'Layout', value: '75%' },
      { label: 'Lighting', value: 'Per-key RGB' },
      { label: 'Keycaps', value: 'PBT' },
    ],
  },
  {
    id: 'nova-camera',
    title: 'Nova Action Camera',
    price: 279,
    rating: 4.5,
    reviews: 1340,
    category: 'Electronics',
    hue: 10,
    shape: 'box',
    inStock: false,
    fastDelivery: false,
    description:
      'Pocket action camera shooting 5.3K video with stabilization and a waterproof housing.',
    specs: [
      { label: 'Video', value: '5.3K60' },
      { label: 'Stabilization', value: 'Yes' },
      { label: 'Waterproof', value: '10 m' },
      { label: 'Battery', value: '90 min' },
    ],
  },
  {
    id: 'cove-humidifier',
    title: 'Cove Smart Humidifier',
    price: 59,
    listPrice: 79,
    rating: 4.2,
    reviews: 388,
    category: 'Home',
    hue: 190,
    shape: 'bottle',
    inStock: true,
    fastDelivery: true,
    description:
      'Ultrasonic humidifier with a 4L tank, auto humidity sensing and a whisper-quiet mode.',
    specs: [
      { label: 'Tank', value: '4 L' },
      { label: 'Runtime', value: '40 hrs' },
      { label: 'Sensor', value: 'Auto' },
      { label: 'Noise', value: '28 dB' },
    ],
  },
  {
    id: 'ridge-wallet',
    title: 'Ridge Slim Card Wallet',
    price: 95,
    rating: 4.6,
    reviews: 2760,
    category: 'Accessories',
    hue: 220,
    shape: 'box',
    inStock: true,
    fastDelivery: true,
    description:
      'Minimalist aluminum wallet with RFID blocking and a track for up to 12 cards.',
    specs: [
      { label: 'Cards', value: 'Up to 12' },
      { label: 'Material', value: 'Aluminum' },
      { label: 'RFID', value: 'Blocking' },
      { label: 'Cash', value: 'Strap' },
    ],
  },
  {
    id: 'zenith-console',
    title: 'Zenith Handheld Console',
    price: 399,
    listPrice: 449,
    rating: 4.7,
    reviews: 1560,
    category: 'Gaming',
    hue: 260,
    shape: 'device',
    inStock: true,
    fastDelivery: false,
    description:
      'A handheld gaming console with a 7-inch 120Hz screen, custom silicon and 512GB storage.',
    specs: [
      { label: 'Display', value: '7" 120 Hz' },
      { label: 'Storage', value: '512 GB' },
      { label: 'Battery', value: '5 hrs' },
      { label: 'Weight', value: '608 g' },
    ],
  },
  {
    id: 'meridian-scale',
    title: 'Meridian Smart Scale',
    price: 45,
    rating: 4.0,
    reviews: 274,
    category: 'Wearables',
    hue: 150,
    shape: 'box',
    inStock: true,
    fastDelivery: true,
    description:
      'Body-composition smart scale syncing weight, BMI and trends to your phone over Bluetooth.',
    specs: [
      { label: 'Metrics', value: '13' },
      { label: 'Users', value: 'Unlimited' },
      { label: 'Connectivity', value: 'Bluetooth' },
      { label: 'Units', value: 'kg / lb' },
    ],
  },
  {
    id: 'solstice-lamp',
    title: 'Solstice Wake-Up Lamp',
    price: 65,
    listPrice: 89,
    rating: 4.4,
    reviews: 610,
    category: 'Home',
    hue: 45,
    shape: 'circle',
    inStock: true,
    fastDelivery: true,
    description:
      'Sunrise-simulating wake-up lamp with sleep sounds, tap dimming and a gentle color glow.',
    specs: [
      { label: 'Modes', value: 'Sunrise · Sunset' },
      { label: 'Sounds', value: '8' },
      { label: 'Brightness', value: '300 lm' },
      { label: 'Snooze', value: 'Tap' },
    ],
  },
]

export const categories: Category[] = [
  'Electronics',
  'Home',
  'Audio',
  'Wearables',
  'Gaming',
  'Accessories',
]

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}
