export interface SeedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
}

export interface SeedDiscountCode {
  code: string;
  percentage: number;
}

export interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: "customer" | "admin";
}

const img = (id: string): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=60`;

export const categories = [
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

export const seedUsers: SeedUser[] = [
  { name: "Admin User", email: "admin@example.com", password: "admin123", role: "admin" },
  { name: "Jane Customer", email: "customer@example.com", password: "customer123", role: "customer" },
];

export const productData: SeedProduct[] = [
  // Electronics (10)
  { name: "Wireless Bluetooth Headphones", description: "Premium noise-cancelling over-ear headphones with 40hr battery life, deep bass and comfortable memory-foam ear cushions.", price: 2499, category: "Electronics", imageUrl: img("1505740420928-5e560c06d30e"), stock: 150 },
  { name: "USB-C Fast Charging Cable", description: "Braided 6ft USB-C cable supporting 100W fast charging and high-speed data transfer.", price: 349, category: "Electronics", imageUrl: img("1583863788434-e58a36330cf0"), stock: 500 },
  { name: "Portable Power Bank 20000mAh", description: "High-capacity power bank with dual USB ports and LED indicator to charge your phone multiple times.", price: 1299, category: "Electronics", imageUrl: img("1609091839311-d5365f9ff1c5"), stock: 200 },
  { name: "Wireless Charging Pad", description: "Qi-compatible 15W fast wireless charger with anti-slip surface and overcharge protection.", price: 699, category: "Electronics", imageUrl: img("1615529182904-14819c35db37"), stock: 300 },
  { name: "Smart LED Desk Lamp", description: "Touch-dimming LED lamp with 5 brightness levels, USB charging port and eye-care lighting.", price: 999, category: "Electronics", imageUrl: img("1507473885765-e6ed057f782c"), stock: 120 },
  { name: "Noise-Minimizing Earbuds", description: "Compact in-ear earbuds with passive noise isolation, in-line mic and tangle-free cable.", price: 899, category: "Electronics", imageUrl: img("1590658268037-6bf12165a8df"), stock: 400 },
  { name: "Webcam HD 1080p", description: "Full HD webcam with auto-focus, built-in dual microphone and plug-and-play USB setup for calls.", price: 1499, category: "Electronics", imageUrl: img("1587829741301-dc798b83add3"), stock: 80 },
  { name: "Mechanical Keyboard RGB", description: "TKL mechanical keyboard with Cherry MX Blue switches, RGB backlighting and detachable USB cable.", price: 2999, category: "Electronics", imageUrl: img("1618384887929-16ec33fab9ef"), stock: 90 },
  { name: "Bluetooth Speaker Mini", description: "Compact waterproof Bluetooth speaker with 12hr playtime and rich 360-degree sound.", price: 1199, category: "Electronics", imageUrl: img("1608043152269-423dbba4e7e1"), stock: 250 },
  { name: "Laptop Stand Aluminum", description: "Ergonomic aluminum laptop stand compatible with 10-17 inch laptops, improves posture and airflow.", price: 1299, category: "Electronics", imageUrl: img("1611078489935-0cb964de46d6"), stock: 110 },

  // Clothing (12)
  { name: "Classic Crew Neck T-Shirt", description: "100% organic cotton crew neck tee, pre-shrunk and available in multiple colors and sizes.", price: 499, category: "Clothing", imageUrl: img("1576566588028-4147f3842f27"), stock: 600 },
  { name: "Slim Fit Denim Jeans", description: "Stretch denim slim-fit jeans with classic five-pocket design and durable stitching.", price: 1499, category: "Clothing", imageUrl: img("1542272604-787c3835535d"), stock: 200 },
  { name: "Fleece Zip-Up Hoodie", description: "Soft fleece hoodie with full-zip front, kangaroo pockets and ribbed cuffs for warmth.", price: 1299, category: "Clothing", imageUrl: img("1556821840-3a63f95609a7"), stock: 180 },
  { name: "Breathable Running Shorts", description: "Lightweight quick-dry running shorts with built-in liner and zip pocket for keys.", price: 799, category: "Clothing", imageUrl: img("1565084888279-aca607ecce0c"), stock: 300 },
  { name: "Merino Wool Socks (3-Pack)", description: "Soft merino wool blend socks that are moisture-wicking, breathable and cushioned.", price: 649, category: "Clothing", imageUrl: img("1586350977771-b3b0abd50c82"), stock: 450 },
  { name: "Waterproof Rain Jacket", description: "Lightweight packable rain jacket with sealed seams, adjustable hood and breathable lining.", price: 1999, category: "Clothing", imageUrl: img("1544022613-e87ca75a784a"), stock: 100 },
  { name: "V-Neck Sweater", description: "Knitted V-neck sweater in 100% cotton, perfect for layering during winter months.", price: 1199, category: "Clothing", imageUrl: img("1434389677669-e08b4cac3105"), stock: 150 },
  { name: "Canvas Sneakers Unisex", description: "Classic low-top canvas sneakers with rubber sole, available for men and women.", price: 999, category: "Clothing", imageUrl: img("1549298916-b41d501d3772"), stock: 220 },
  { name: "Trail Running Shoes", description: "Lightweight trail running shoes with cushioned midsole and grippy outsole for any terrain.", price: 1899, category: "Clothing", imageUrl: img("1542291026-7eec264c27ff"), stock: 140 },
  { name: "Classic Leather Jacket", description: "Genuine leather moto jacket with quilted lining, zip pockets and a timeless look.", price: 4999, category: "Clothing", imageUrl: img("1551028719-00167b16eac5"), stock: 60 },
  { name: "Leather Belt Classic", description: "Genuine leather belt with brushed nickel buckle, sturdy and stylish for daily wear.", price: 899, category: "Clothing", imageUrl: img("1624222247344-550fb60583dc"), stock: 170 },
  { name: "Sun Hat Wide Brim", description: "UV-protective wide-brim straw hat that is packable and perfect for travel and beaches.", price: 699, category: "Clothing", imageUrl: img("1573408301185-9146fe634ad0"), stock: 130 },

  // Home & Kitchen (10)
  { name: "Stainless Steel Water Bottle", description: "Double-wall insulated 32oz water bottle that keeps drinks cold for 24hr or hot for 12hr.", price: 699, category: "Home & Kitchen", imageUrl: img("1602143407151-7111542de6e8"), stock: 350 },
  { name: "Non-Stick Frying Pan 12\"", description: "Ceramic non-stick frying pan with heat-resistant handle and even heat distribution.", price: 999, category: "Home & Kitchen", imageUrl: img("1590794056226-79ef3a8147e1"), stock: 140 },
  { name: "Bamboo Cutting Board Set", description: "Set of 3 bamboo cutting boards with juice groove, eco-friendly and knife-friendly.", price: 899, category: "Home & Kitchen", imageUrl: img("1574258495973-f010dfbb5371"), stock: 200 },
  { name: "French Press Coffee Maker", description: "34oz stainless steel French press with double filtration for rich, full-bodied coffee.", price: 799, category: "Home & Kitchen", imageUrl: img("1495474472287-4d71bcdd2085"), stock: 180 },
  { name: "Silicone Baking Mat Set", description: "Set of 2 non-stick silicone baking mats, reusable and dishwasher safe.", price: 549, category: "Home & Kitchen", imageUrl: img("1556910103-1c02745aae4d"), stock: 270 },
  { name: "Ceramic Mug Set (4-Pack)", description: "Hand-glazed ceramic mugs, 12oz each, microwave and dishwasher safe.", price: 999, category: "Home & Kitchen", imageUrl: img("1514228742587-6b1558fcca3d"), stock: 160 },
  { name: "Robot Vacuum Cleaner", description: "Smart robot vacuum with app control, mapping and auto-charging for effortless cleaning.", price: 8999, category: "Home & Kitchen", imageUrl: img("1558317374-067fb5f30001"), stock: 40 },
  { name: "Memory Foam Pillow", description: "Contoured memory foam pillow with breathable bamboo cover for proper neck support.", price: 1399, category: "Home & Kitchen", imageUrl: img("1522771739844-6a9f6d5f14af"), stock: 130 },
  { name: "LED String Lights 10m", description: "Warm white fairy lights with 8 modes and remote control, perfect for decoration.", price: 449, category: "Home & Kitchen", imageUrl: img("1519751138087-5bf79df62d5b"), stock: 400 },
  { name: "Cast Iron Dutch Oven 6qt", description: "Enameled cast iron Dutch oven, perfect for slow-cooked soups, stews and biryani.", price: 2499, category: "Home & Kitchen", imageUrl: img("1506084868230-bb9d95c24759"), stock: 75 },

  // Books (8)
  { name: "The Art of Clean Code", description: "A practical guide to writing maintainable, readable software with clean principles.", price: 899, category: "Books", imageUrl: img("1517180102446-f3ece451e9d8"), stock: 300 },
  { name: "JavaScript: The Good Parts", description: "Classic O'Reilly book on the best practices and good parts of JavaScript.", price: 699, category: "Books", imageUrl: img("1579468118864-1b9ea3c0db4a"), stock: 250 },
  { name: "Designing Data-Intensive Applications", description: "A deep dive into distributed systems, data engineering and scalable architecture.", price: 1499, category: "Books", imageUrl: img("1558494949-ef010cbdcc31"), stock: 150 },
  { name: "Atomic Habits", description: "Proven strategies to build good habits, break bad ones and master tiny behaviors.", price: 599, category: "Books", imageUrl: img("1544816155-12df9643f363"), stock: 500 },
  { name: "Clean Architecture", description: "Robert Martin's guide to software structure, design principles and maintainability.", price: 1099, category: "Books", imageUrl: img("1512820790803-83ca734da794"), stock: 200 },
  { name: "Deep Work", description: "Rules for focused success in a distracted world, by Cal Newport.", price: 549, category: "Books", imageUrl: img("1456324504439-367cee3b3c32"), stock: 320 },
  { name: "The Pragmatic Programmer", description: "Timeless advice for software developers on craft, productivity and career.", price: 1299, category: "Books", imageUrl: img("1461749280684-dccba630e2f6"), stock: 180 },
  { name: "Think Like a Monk", description: "Jay Shetty's guide to training your mind for peace, purpose and mindfulness.", price: 649, category: "Books", imageUrl: img("1506126613408-eca07ce68773"), stock: 270 },

  // Sports & Outdoors (8)
  { name: "Yoga Mat 6mm", description: "Non-slip TPE yoga mat with alignment lines and carry strap for home workouts.", price: 899, category: "Sports & Outdoors", imageUrl: img("1544367567-0f2fcb009e0b"), stock: 200 },
  { name: "Resistance Bands Set", description: "Set of 5 latex-free resistance bands with varying tension for full-body training.", price: 599, category: "Sports & Outdoors", imageUrl: img("1518314916381-77a37c2a49ae"), stock: 350 },
  { name: "Insulated Travel Mug 20oz", description: "Double-wall vacuum insulated mug with leak-proof lid, keeps drinks hot for hours.", price: 649, category: "Sports & Outdoors", imageUrl: img("1571068316344-75bc76f77890"), stock: 280 },
  { name: "Camping Headlamp", description: "Rechargeable LED headlamp with 3 modes, adjustable strap and IPX4 waterproof rating.", price: 549, category: "Sports & Outdoors", imageUrl: img("1504280390367-361c6d9f38f4"), stock: 220 },
  { name: "Foam Roller 18\"", description: "High-density foam roller for muscle recovery, deep tissue massage and flexibility.", price: 699, category: "Sports & Outdoors", imageUrl: img("1518611012118-696072aa579a"), stock: 170 },
  { name: "Jump Rope Speed", description: "Adjustable speed jump rope with ball bearings and foam grips for cardio training.", price: 399, category: "Sports & Outdoors", imageUrl: img("1571019613454-1cb2f99b2d8b"), stock: 300 },
  { name: "Hiking Daypack 25L", description: "Lightweight daypack with hydration sleeve, rain cover and multiple compartments.", price: 1299, category: "Sports & Outdoors", imageUrl: img("1551632811-561732d1e306"), stock: 120 },
  { name: "Swim Goggles Anti-Fog", description: "Anti-fog UV protection swim goggles with adjustable strap and wide vision.", price: 449, category: "Sports & Outdoors", imageUrl: img("1523301343968-6a6ebf63c672"), stock: 250 },

  // Beauty (8)
  { name: "Vitamin C Serum 30ml", description: "Brightening vitamin C serum with hyaluronic acid for glowing, even-toned skin.", price: 699, category: "Beauty", imageUrl: img("1556228720-195a672e8a03"), stock: 200 },
  { name: "Bamboo Makeup Remover Pads", description: "Reusable set of 12 bamboo rounds, washable, eco-friendly and gentle on skin.", price: 449, category: "Beauty", imageUrl: img("1596462502278-27bfdc403348"), stock: 300 },
  { name: "Shea Butter Lip Balm (3-Pack)", description: "Moisturizing lip balm with shea butter and vitamin E, keeps lips soft all day.", price: 299, category: "Beauty", imageUrl: img("1631729371254-42c2892f0e6e"), stock: 500 },
  { name: "Hair Styling Gel Strong Hold", description: "Alcohol-free strong hold gel that gives all-day styling without flaking.", price: 349, category: "Beauty", imageUrl: img("1522337660859-02fbefca4702"), stock: 350 },
  { name: "Facial Cleanser Gentle", description: "pH-balanced gentle foaming cleanser for sensitive skin, removes dirt without drying.", price: 549, category: "Beauty", imageUrl: img("1620916566398-39f1143ab7be"), stock: 220 },
  { name: "Sunscreen SPF 50", description: "Broad-spectrum SPF 50 sunscreen that is water-resistant, non-greasy and PA+++.", price: 499, category: "Beauty", imageUrl: img("1550985616-10810253b84d"), stock: 250 },
  { name: "Retinol Night Cream", description: "Anti-aging night cream with retinol and peptides to reduce fine lines overnight.", price: 999, category: "Beauty", imageUrl: img("1571781926291-c477ebfd024b"), stock: 150 },
  { name: "Natural Loofah Sponge Set", description: "Set of 3 biodegradable loofah sponges for body exfoliation and gentle scrubbing.", price: 299, category: "Beauty", imageUrl: img("1544161515-4ab6ce6db874"), stock: 400 },

  // Toys (5)
  { name: "Building Block Set 500pc", description: "Compatible interlocking building blocks, a creative play set for kids of all ages.", price: 1099, category: "Toys", imageUrl: img("1587654780291-39c9404d746b"), stock: 150 },
  { name: "RC Racing Car", description: "High-speed remote control car with rechargeable battery and durable chassis.", price: 1299, category: "Toys", imageUrl: img("1542362567-b07e54358753"), stock: 100 },
  { name: "Wooden Puzzle 1000pc", description: "Jigsaw puzzle featuring a beautiful landscape scene, challenging and relaxing.", price: 549, category: "Toys", imageUrl: img("1611996575749-79a3a250f948"), stock: 200 },
  { name: "Plush Teddy Bear Large", description: "Soft 18-inch plush teddy bear, the perfect cuddle companion for children.", price: 799, category: "Toys", imageUrl: img("1562040506-a9b32cb51b94"), stock: 180 },
  { name: "Board Game Strategy", description: "Award-winning strategy board game for 2-4 players, great for family game night.", price: 1499, category: "Toys", imageUrl: img("1610890716171-6b1bb98ffd09"), stock: 90 },

  // Grocery (5)
  { name: "Organic Green Tea (100 Bags)", description: "Premium organic green tea bags, individually wrapped for freshness and flavor.", price: 449, category: "Grocery", imageUrl: img("1576092768241-dec231879fc3"), stock: 400 },
  { name: "Raw Almonds 500g Bag", description: "Premium raw almonds, unsalted and unroasted, rich in protein and healthy fats.", price: 349, category: "Grocery", imageUrl: img("1508061253366-f7da158b6d46"), stock: 300 },
  { name: "Extra Virgin Olive Oil 500ml", description: "Cold-pressed extra virgin olive oil, ideal for salads, cooking and dressings.", price: 549, category: "Grocery", imageUrl: img("1474979266404-7eaacbcd87c5"), stock: 200 },
  { name: "Dark Chocolate 85% (3-Pack)", description: "Single-origin dark chocolate bars with 85% cacao, rich and low in sugar.", price: 449, category: "Grocery", imageUrl: img("1511381939415-e44015466834"), stock: 250 },
  { name: "Honey Raw Unfiltered 500g", description: "Raw unfiltered honey with natural enzymes, great with tea, toast or curd.", price: 499, category: "Grocery", imageUrl: img("1558642452-9d2a7deb7f62"), stock: 180 },

  // Automotive (4)
  { name: "Car Phone Mount", description: "Adjustable car phone mount with strong suction cup, one-hand release and 360 rotation.", price: 549, category: "Automotive", imageUrl: img("1580273916550-e323be2ae537"), stock: 250 },
  { name: "Microfiber Cleaning Cloths (10-Pack)", description: "Lint-free microfiber towels for car detailing, streak-free and highly absorbent.", price: 349, category: "Automotive", imageUrl: img("1607860108855-64acf2078ed9"), stock: 400 },
  { name: "Car Air Freshener (4-Pack)", description: "Long-lasting vanilla-scented car air fresheners that keep your cabin fresh.", price: 299, category: "Automotive", imageUrl: img("1511919884226-fd3cad34687c"), stock: 500 },
  { name: "Trunk Organizer Collapsible", description: "Multi-compartment collapsible trunk organizer with lid, keeps your boot tidy.", price: 849, category: "Automotive", imageUrl: img("1503376780353-7e6692767b70"), stock: 120 },

  // Health (3)
  { name: "Digital Thermometer", description: "Instant-read digital thermometer with fever alarm and memory function.", price: 349, category: "Health", imageUrl: img("1576091160399-112ba8d25d1d"), stock: 300 },
  { name: "Pill Organizer Weekly", description: "7-day pill organizer with labeled compartments to keep your medication routine on track.", price: 249, category: "Health", imageUrl: img("1587854692152-cbe660dbde88"), stock: 350 },
  { name: "Hand Grip Strengthener", description: "Adjustable hand grip strengthener with 10-40kg resistance for forearm training.", price: 449, category: "Health", imageUrl: img("1526506118085-60ce8714f8c5"), stock: 200 },
];

export const discountCodes: SeedDiscountCode[] = [
  { code: "SAVE10", percentage: 10 },
  { code: "WELCOME20", percentage: 20 },
  { code: "FREESHIP15", percentage: 15 },
  { code: "HOLIDAY30", percentage: 30 },
  { code: "FLAT5", percentage: 5 },
];
