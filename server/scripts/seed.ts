import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { DiscountCode } from "../src/models/DiscountCode";

const categories = [
  "Electronics",
  "Clothing",
  "Home & Kitchen",
  "Books",
  "Sports & Outdoors",
  "Beauty",
  "Toys",
  "Grocery",
  "Automotive",
  "Health",
];

const productData: Omit<Parameters<typeof Product.create>[0], any>[] = [
  // Electronics (10)
  { name: "Wireless Bluetooth Headphones", description: "Premium noise-cancelling over-ear headphones with 40hr battery life and deep bass.", price: 79.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/headphones/400/400", stock: 150 },
  { name: "USB-C Fast Charging Cable", description: "Braided 6ft USB-C cable supporting 100W fast charging and data transfer.", price: 12.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/usbc/400/400", stock: 500 },
  { name: "Portable Power Bank 20000mAh", description: "High-capacity power bank with dual USB ports and LED indicator.", price: 34.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/powerbank/400/400", stock: 200 },
  { name: "Wireless Charging Pad", description: "Qi-compatible 15W fast wireless charger with anti-slip surface.", price: 19.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/charger/400/400", stock: 300 },
  { name: "Smart LED Desk Lamp", description: "Touch-dimming LED lamp with 5 brightness levels and USB charging port.", price: 29.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/desklamp/400/400", stock: 120 },
  { name: "Noise-Minimizing Earbuds", description: "Compact in-ear earbuds with passive noise isolation and mic.", price: 24.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/earbuds/400/400", stock: 400 },
  { name: "Webcam HD 1080p", description: "Full HD webcam with auto-focus and built-in dual microphone.", price: 49.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/webcam/400/400", stock: 80 },
  { name: "Mechanical Keyboard RGB", description: "TKL mechanical keyboard with Cherry MX Blue switches and RGB backlighting.", price: 69.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/keyboard/400/400", stock: 90 },
  { name: "Bluetooth Speaker Mini", description: "Compact waterproof Bluetooth speaker with 12hr playtime.", price: 29.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/speaker/400/400", stock: 250 },
  { name: "Laptop Stand Aluminum", description: "Ergonomic aluminum laptop stand compatible with 10-17 inch laptops.", price: 39.99, category: "Electronics", imageUrl: "https://picsum.photos/seed/laptopstand/400/400", stock: 110 },

  // Clothing (10)
  { name: "Classic Crew Neck T-Shirt", description: "100% organic cotton crew neck tee available in multiple colors.", price: 14.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/tshirt/400/400", stock: 600 },
  { name: "Slim Fit Denim Jeans", description: "Stretch denim slim-fit jeans with classic five-pocket design.", price: 44.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/jeans/400/400", stock: 200 },
  { name: "Fleece Zip-Up Hoodie", description: "Soft fleece hoodie with full-zip front and kangaroo pockets.", price: 39.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/hoodie/400/400", stock: 180 },
  { name: "Breathable Running Shorts", description: "Lightweight running shorts with built-in liner and zip pocket.", price: 22.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/shorts/400/400", stock: 300 },
  { name: "Merino Wool Socks (3-Pack)", description: "Soft merino wool blend socks, moisture-wicking, cushioned sole.", price: 18.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/socks/400/400", stock: 450 },
  { name: "Waterproof Rain Jacket", description: "Lightweight packable rain jacket with sealed seams and hood.", price: 59.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/rainjacket/400/400", stock: 100 },
  { name: "V-Neck Sweater", description: "Knitted V-neck sweater in 100% cotton, perfect for layering.", price: 34.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/sweater/400/400", stock: 150 },
  { name: "Canvas Sneakers Unisex", description: "Classic low-top canvas sneakers with rubber sole.", price: 29.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/sneakers/400/400", stock: 220 },
  { name: "Leather Belt Classic", description: "Genuine leather belt with brushed nickel buckle.", price: 24.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/belt/400/400", stock: 170 },
  { name: "Sun Hat Wide Brim", description: "UV-protective wide-brim straw hat, packable for travel.", price: 19.99, category: "Clothing", imageUrl: "https://picsum.photos/seed/sunhat/400/400", stock: 130 },

  // Home & Kitchen (10)
  { name: "Stainless Steel Water Bottle", description: "Double-wall insulated 32oz water bottle, keeps cold 24hr or hot 12hr.", price: 19.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/bottle/400/400", stock: 350 },
  { name: "Non-Stick Frying Pan 12\"", description: "Ceramic non-stick frying pan with heat-resistant handle.", price: 29.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/pan/400/400", stock: 140 },
  { name: "Bamboo Cutting Board Set", description: "Set of 3 bamboo cutting boards with juice groove.", price: 24.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/cuttingboard/400/400", stock: 200 },
  { name: "French Press Coffee Maker", description: "34oz stainless steel French press with double filtration.", price: 22.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/frenchpress/400/400", stock: 180 },
  { name: "Silicone Baking Mat Set", description: "Set of 2 non-stick silicone mats, reusable and dishwasher safe.", price: 14.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/bakingmat/400/400", stock: 270 },
  { name: "Ceramic Mug Set (4-Pack)", description: "Hand-glazed ceramic mugs, 12oz each, microwave safe.", price: 29.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/mugs/400/400", stock: 160 },
  { name: "Robot Vacuum Cleaner", description: "Smart robot vacuum with app control and auto-charging.", price: 199.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/vacuum/400/400", stock: 40 },
  { name: "Memory Foam Pillow", description: "Contoured memory foam pillow with breathable bamboo cover.", price: 39.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/pillow/400/400", stock: 130 },
  { name: "LED String Lights 10m", description: "Warm white fairy lights with 8 modes and remote control.", price: 12.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/stringlights/400/400", stock: 400 },
  { name: "Cast Iron Dutch Oven 6qt", description: "Enameled cast iron Dutch oven, perfect for soups and stews.", price: 59.99, category: "Home & Kitchen", imageUrl: "https://picsum.photos/seed/dutchoven/400/400", stock: 75 },

  // Books (8)
  { name: "The Art of Clean Code", description: "A guide to writing maintainable, readable software.", price: 24.99, category: "Books", imageUrl: "https://picsum.photos/seed/book1/400/400", stock: 300 },
  { name: "JavaScript: The Good Parts", description: "Classic O'Reilly book on best practices in JavaScript.", price: 19.99, category: "Books", imageUrl: "https://picsum.photos/seed/book2/400/400", stock: 250 },
  { name: "Designing Data-Intensive Applications", description: "Deep dive into distributed systems and data engineering.", price: 39.99, category: "Books", imageUrl: "https://picsum.photos/seed/book3/400/400", stock: 150 },
  { name: "Atomic Habits", description: "Build good habits and break bad ones with proven strategies.", price: 16.99, category: "Books", imageUrl: "https://picsum.photos/seed/book4/400/400", stock: 500 },
  { name: "Clean Architecture", description: "Robert Martin's guide to software structure and design.", price: 29.99, category: "Books", imageUrl: "https://picsum.photos/seed/book5/400/400", stock: 200 },
  { name: "Deep Work", description: "Rules for focused success in a distracted world.", price: 15.99, category: "Books", imageUrl: "https://picsum.photos/seed/book6/400/400", stock: 320 },
  { name: "The Pragmatic Programmer", description: "Timeless advice for software developers.", price: 34.99, category: "Books", imageUrl: "https://picsum.photos/seed/book7/400/400", stock: 180 },
  { name: "Think Like a Monk", description: "Train your mind for peace and purpose.", price: 18.99, category: "Books", imageUrl: "https://picsum.photos/seed/book8/400/400", stock: 270 },

  // Sports & Outdoors (8)
  { name: "Yoga Mat 6mm", description: "Non-slip TPE yoga mat with alignment lines and carry strap.", price: 24.99, category: "Sports & Outdoors", imageUrl: "https://picsum.photos/seed/yogamat/400/400", stock: 200 },
  { name: "Resistance Bands Set", description: "Set of 5 latex-free resistance bands with varying tension.", price: 16.99, category: "Sports & Outdoors", imageUrl: "https://picsum.photos/seed/bands/400/400", stock: 350 },
  { name: "Insulated Travel Mug 20oz", description: "Double-wall vacuum insulated mug with leak-proof lid.", price: 17.99, category: "Sports & Outdoors", imageUrl: "https://picsum.photos/seed/travelmug/400/400", stock: 280 },
  { name: "Camping Headlamp", description: "Rechargeable LED headlamp with 3 modes and IPX4 waterproof.", price: 14.99, category: "Sports & Outdoors", imageUrl: "https://picsum.photos/seed/headlamp/400/400", stock: 220 },
  { name: "Foam Roller 18\"", description: "High-density foam roller for muscle recovery and massage.", price: 19.99, category: "Sports & Outdoors", imageUrl: "https://picsum.photos/seed/foamroller/400/400", stock: 170 },
  { name: "Jump Rope Speed", description: "Adjustable speed jump rope with ball bearings and foam grip.", price: 11.99, category: "Sports & Outdoors", imageUrl: "https://picsum.photos/seed/jumprope/400/400", stock: 300 },
  { name: "Hiking Daypack 25L", description: "Lightweight daypack with hydration sleeve and rain cover.", price: 34.99, category: "Sports & Outdoors", imageUrl: "https://picsum.photos/seed/daypack/400/400", stock: 120 },
  { name: "Swim Goggles Anti-Fog", description: "Anti-fog UV protection swim goggles with adjustable strap.", price: 12.99, category: "Sports & Outdoors", imageUrl: "https://picsum.photos/seed/goggles/400/400", stock: 250 },

  // Beauty (7)
  { name: "Vitamin C Serum 30ml", description: "Brightening vitamin C serum with hyaluronic acid.", price: 18.99, category: "Beauty", imageUrl: "https://picsum.photos/seed/serum/400/400", stock: 200 },
  { name: "Bamboo Makeup Remover Pads", description: "Reusable set of 12 bamboo rounds, washable and eco-friendly.", price: 12.99, category: "Beauty", imageUrl: "https://picsum.photos/seed/makeuppads/400/400", stock: 300 },
  { name: "Shea Butter Lip Balm (3-Pack)", description: "Moisturizing lip balm with shea butter and vitamin E.", price: 8.99, category: "Beauty", imageUrl: "https://picsum.photos/seed/lipbalm/400/400", stock: 500 },
  { name: "Hair Styling Gel Strong Hold", description: "Alcohol-free strong hold gel for all hair types.", price: 9.99, category: "Beauty", imageUrl: "https://picsum.photos/seed/hairgel/400/400", stock: 350 },
  { name: "Facial Cleanser Gentle", description: "pH-balanced gentle foaming cleanser for sensitive skin.", price: 14.99, category: "Beauty", imageUrl: "https://picsum.photos/seed/cleanser/400/400", stock: 220 },
  { name: "Retinol Night Cream", description: "Anti-aging night cream with retinol and peptides.", price: 27.99, category: "Beauty", imageUrl: "https://picsum.photos/seed/nightcream/400/400", stock: 150 },
  { name: "Natural Loofah Sponge Set", description: "Set of 3 biodegradable loofah sponges for body and kitchen.", price: 7.99, category: "Beauty", imageUrl: "https://picsum.photos/seed/loofah/400/400", stock: 400 },

  // Toys (5)
  { name: "Building Block Set 500pc", description: "Compatible interlocking building blocks, creative play set.", price: 29.99, category: "Toys", imageUrl: "https://picsum.photos/seed/blocks/400/400", stock: 150 },
  { name: "RC Racing Car", description: "High-speed remote control car with rechargeable battery.", price: 34.99, category: "Toys", imageUrl: "https://picsum.photos/seed/rccar/400/400", stock: 100 },
  { name: "Wooden Puzzle 1000pc", description: "Jigsaw puzzle featuring a beautiful landscape scene.", price: 14.99, category: "Toys", imageUrl: "https://picsum.photos/seed/puzzle/400/400", stock: 200 },
  { name: "Plush Teddy Bear Large", description: "Soft 18-inch plush teddy bear, perfect cuddle companion.", price: 22.99, category: "Toys", imageUrl: "https://picsum.photos/seed/teddy/400/400", stock: 180 },
  { name: "Board Game Strategy", description: "Award-winning strategy board game for 2-4 players.", price: 39.99, category: "Toys", imageUrl: "https://picsum.photos/seed/boardgame/400/400", stock: 90 },

  // Grocery (5)
  { name: "Organic Green Tea (100 Bags)", description: "Premium Japanese organic green tea bags, individually wrapped.", price: 12.99, category: "Grocery", imageUrl: "https://picsum.photos/seed/greentea/400/400", stock: 400 },
  { name: "Raw Almonds 1lb Bag", description: "California raw almonds, unsalted and unroasted.", price: 9.99, category: "Grocery", imageUrl: "https://picsum.photos/seed/almonds/400/400", stock: 300 },
  { name: "Extra Virgin Olive Oil 500ml", description: "Cold-pressed extra virgin olive oil from Italy.", price: 14.99, category: "Grocery", imageUrl: "https://picsum.photos/seed/oliveoil/400/400", stock: 200 },
  { name: "Dark Chocolate 85% (3-Pack)", description: "Single-origin dark chocolate bars, 85% cacao.", price: 11.99, category: "Grocery", imageUrl: "https://picsum.photos/seed/chocolate/400/400", stock: 250 },
  { name: "Honey Raw Unfiltered 16oz", description: "Raw unfiltered honey from local apiaries.", price: 13.99, category: "Grocery", imageUrl: "https://picsum.photos/seed/honey/400/400", stock: 180 },

  // Automotive (4)
  { name: "Car Phone Mount", description: "Adjustable car phone mount with strong suction cup.", price: 14.99, category: "Automotive", imageUrl: "https://picsum.photos/seed/phonemount/400/400", stock: 250 },
  { name: "Microfiber Cleaning Cloths (10-Pack)", description: "Lint-free microfiber towels for car detailing.", price: 9.99, category: "Automotive", imageUrl: "https://picsum.photos/seed/cloth/400/400", stock: 400 },
  { name: "Car Air Freshener (4-Pack)", description: "Long-lasting vanilla-scented car air fresheners.", price: 7.99, category: "Automotive", imageUrl: "https://picsum.photos/seed/freshener/400/400", stock: 500 },
  { name: "Trunk Organizer Collapsible", description: "Multi-compartment collapsible trunk organizer with lid.", price: 22.99, category: "Automotive", imageUrl: "https://picsum.photos/seed/trunk/400/400", stock: 120 },

  // Health (3)
  { name: "Digital Thermometer", description: "Instant-read digital thermometer with fever alarm.", price: 9.99, category: "Health", imageUrl: "https://picsum.photos/seed/thermometer/400/400", stock: 300 },
  { name: "Pill Organizer Weekly", description: "7-day pill organizer with labeled compartments.", price: 6.99, category: "Health", imageUrl: "https://picsum.photos/seed/pillbox/400/400", stock: 350 },
  { name: "Hand Grip Strengthener", description: "Adjustable hand grip strengthener, 10-40kg resistance.", price: 12.99, category: "Health", imageUrl: "https://picsum.photos/seed/gripper/400/400", stock: 200 },
];

const discountCodes = [
  { code: "SAVE10", percentage: 10 },
  { code: "WELCOME20", percentage: 20 },
  { code: "FREESHIP15", percentage: 15 },
  { code: "HOLIDAY30", percentage: 30 },
  { code: "FLAT5", percentage: 5 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB connected for seeding");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      DiscountCode.deleteMany({}),
    ]);
    console.log("Cleared existing data");

    // Create test users
    const admin = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
    });

    const customer = await User.create({
      name: "Jane Customer",
      email: "customer@example.com",
      password: "customer123",
      role: "customer",
    });

    console.log(`Created users: admin@example.com / admin123, customer@example.com / customer123`);

    // Create products
    const products = await Product.insertMany(productData);
    console.log(`Created ${products.length} products`);

    // Create discount codes
    await DiscountCode.insertMany(discountCodes);
    console.log(`Created ${discountCodes.length} discount codes: ${discountCodes.map((d) => d.code).join(", ")}`);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
