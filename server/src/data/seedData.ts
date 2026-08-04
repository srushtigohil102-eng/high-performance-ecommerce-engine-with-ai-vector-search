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
  { name: "Wireless Bluetooth Headphones", description: "Premium noise-cancelling over-ear headphones with 40hr battery life, deep bass and comfortable memory-foam ear cushions.", price: 2499, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/headphones,wireless?lock=1", stock: 150 },
  { name: "USB-C Fast Charging Cable", description: "Braided 6ft USB-C cable supporting 100W fast charging and high-speed data transfer.", price: 349, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/usbcable,charging?lock=2", stock: 500 },
  { name: "Portable Power Bank 20000mAh", description: "High-capacity power bank with dual USB ports and LED indicator to charge your phone multiple times.", price: 1299, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/powerbank,charger?lock=3", stock: 200 },
  { name: "Wireless Charging Pad", description: "Qi-compatible 15W fast wireless charger with anti-slip surface and overcharge protection.", price: 699, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/wirelesscharger,qi?lock=4", stock: 300 },
  { name: "Smart LED Desk Lamp", description: "Touch-dimming LED lamp with 5 brightness levels, USB charging port and eye-care lighting.", price: 999, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/desklamp,led?lock=5", stock: 120 },
  { name: "Noise-Minimizing Earbuds", description: "Compact in-ear earbuds with passive noise isolation, in-line mic and tangle-free cable.", price: 899, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/earbuds,audio?lock=6", stock: 400 },
  { name: "Webcam HD 1080p", description: "Full HD webcam with auto-focus, built-in dual microphone and plug-and-play USB setup for calls.", price: 1499, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/webcam,computer?lock=7", stock: 80 },
  { name: "Mechanical Keyboard RGB", description: "TKL mechanical keyboard with Cherry MX Blue switches, RGB backlighting and detachable USB cable.", price: 2999, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/keyboard,mechanical?lock=8", stock: 90 },
  { name: "Bluetooth Speaker Mini", description: "Compact waterproof Bluetooth speaker with 12hr playtime and rich 360-degree sound.", price: 1199, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/speaker,bluetooth?lock=9", stock: 250 },
  { name: "Laptop Stand Aluminum", description: "Ergonomic aluminum laptop stand compatible with 10-17 inch laptops, improves posture and airflow.", price: 1299, category: "Electronics", imageUrl: "https://loremflickr.com/400/400/laptopstand,aluminum?lock=10", stock: 110 },

  // Clothing (12)
  { name: "Classic Crew Neck T-Shirt", description: "100% organic cotton crew neck tee, pre-shrunk and available in multiple colors and sizes.", price: 499, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/tshirt,cotton?lock=11", stock: 600 },
  { name: "Slim Fit Denim Jeans", description: "Stretch denim slim-fit jeans with classic five-pocket design and durable stitching.", price: 1499, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/jeans,denim?lock=12", stock: 200 },
  { name: "Fleece Zip-Up Hoodie", description: "Soft fleece hoodie with full-zip front, kangaroo pockets and ribbed cuffs for warmth.", price: 1299, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/hoodie,fleece?lock=13", stock: 180 },
  { name: "Breathable Running Shorts", description: "Lightweight quick-dry running shorts with built-in liner and zip pocket for keys.", price: 799, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/runningshorts,sport?lock=14", stock: 300 },
  { name: "Merino Wool Socks (3-Pack)", description: "Soft merino wool blend socks that are moisture-wicking, breathable and cushioned.", price: 649, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/socks,wool?lock=15", stock: 450 },
  { name: "Waterproof Rain Jacket", description: "Lightweight packable rain jacket with sealed seams, adjustable hood and breathable lining.", price: 1999, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/rainjacket,waterproof?lock=16", stock: 100 },
  { name: "V-Neck Sweater", description: "Knitted V-neck sweater in 100% cotton, perfect for layering during winter months.", price: 1199, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/sweater,knit?lock=17", stock: 150 },
  { name: "Canvas Sneakers Unisex", description: "Classic low-top canvas sneakers with rubber sole, available for men and women.", price: 999, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/sneakers,canvas?lock=18", stock: 220 },
  { name: "Trail Running Shoes", description: "Lightweight trail running shoes with cushioned midsole and grippy outsole for any terrain.", price: 1899, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/runningshoes,trail?lock=19", stock: 140 },
  { name: "Classic Leather Jacket", description: "Genuine leather moto jacket with quilted lining, zip pockets and a timeless look.", price: 4999, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/leatherjacket,moto?lock=20", stock: 60 },
  { name: "Leather Belt Classic", description: "Genuine leather belt with brushed nickel buckle, sturdy and stylish for daily wear.", price: 899, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/leatherbelt,accessory?lock=21", stock: 170 },
  { name: "Sun Hat Wide Brim", description: "UV-protective wide-brim straw hat that is packable and perfect for travel and beaches.", price: 699, category: "Clothing", imageUrl: "https://loremflickr.com/400/400/sunhat,straw?lock=22", stock: 130 },

  // Home & Kitchen (10)
  { name: "Stainless Steel Water Bottle", description: "Double-wall insulated 32oz water bottle that keeps drinks cold for 24hr or hot for 12hr.", price: 699, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/waterbottle,steel?lock=23", stock: 350 },
  { name: "Non-Stick Frying Pan 12\"", description: "Ceramic non-stick frying pan with heat-resistant handle and even heat distribution.", price: 999, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/fryingpan,cooking?lock=24", stock: 140 },
  { name: "Bamboo Cutting Board Set", description: "Set of 3 bamboo cutting boards with juice groove, eco-friendly and knife-friendly.", price: 899, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/cuttingboard,bamboo?lock=25", stock: 200 },
  { name: "French Press Coffee Maker", description: "34oz stainless steel French press with double filtration for rich, full-bodied coffee.", price: 799, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/frenchpress,coffee?lock=26", stock: 180 },
  { name: "Silicone Baking Mat Set", description: "Set of 2 non-stick silicone baking mats, reusable and dishwasher safe.", price: 549, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/bakingmat,silicone?lock=27", stock: 270 },
  { name: "Ceramic Mug Set (4-Pack)", description: "Hand-glazed ceramic mugs, 12oz each, microwave and dishwasher safe.", price: 999, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/ceramicmugs,coffee?lock=28", stock: 160 },
  { name: "Robot Vacuum Cleaner", description: "Smart robot vacuum with app control, mapping and auto-charging for effortless cleaning.", price: 8999, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/robotvacuum,cleaning?lock=29", stock: 40 },
  { name: "Memory Foam Pillow", description: "Contoured memory foam pillow with breathable bamboo cover for proper neck support.", price: 1399, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/pillow,foam?lock=30", stock: 130 },
  { name: "LED String Lights 10m", description: "Warm white fairy lights with 8 modes and remote control, perfect for decoration.", price: 449, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/stringlights,led?lock=31", stock: 400 },
  { name: "Cast Iron Dutch Oven 6qt", description: "Enameled cast iron Dutch oven, perfect for slow-cooked soups, stews and biryani.", price: 2499, category: "Home & Kitchen", imageUrl: "https://loremflickr.com/400/400/dutchoven,castiron?lock=32", stock: 75 },

  // Books (8)
  { name: "The Art of Clean Code", description: "A practical guide to writing maintainable, readable software with clean principles.", price: 899, category: "Books", imageUrl: "https://loremflickr.com/400/400/books,software?lock=33", stock: 300 },
  { name: "JavaScript: The Good Parts", description: "Classic O'Reilly book on the best practices and good parts of JavaScript.", price: 699, category: "Books", imageUrl: "https://loremflickr.com/400/400/book,javascript?lock=34", stock: 250 },
  { name: "Designing Data-Intensive Applications", description: "A deep dive into distributed systems, data engineering and scalable architecture.", price: 1499, category: "Books", imageUrl: "https://loremflickr.com/400/400/book,datascience?lock=35", stock: 150 },
  { name: "Atomic Habits", description: "Proven strategies to build good habits, break bad ones and master tiny behaviors.", price: 599, category: "Books", imageUrl: "https://loremflickr.com/400/400/book,selfhelp?lock=36", stock: 500 },
  { name: "Clean Architecture", description: "Robert Martin's guide to software structure, design principles and maintainability.", price: 1099, category: "Books", imageUrl: "https://loremflickr.com/400/400/book,architecture?lock=37", stock: 200 },
  { name: "Deep Work", description: "Rules for focused success in a distracted world, by Cal Newport.", price: 549, category: "Books", imageUrl: "https://loremflickr.com/400/400/book,focus?lock=38", stock: 320 },
  { name: "The Pragmatic Programmer", description: "Timeless advice for software developers on craft, productivity and career.", price: 1299, category: "Books", imageUrl: "https://loremflickr.com/400/400/book,programming?lock=39", stock: 180 },
  { name: "Think Like a Monk", description: "Jay Shetty's guide to training your mind for peace, purpose and mindfulness.", price: 649, category: "Books", imageUrl: "https://loremflickr.com/400/400/book,mindfulness?lock=40", stock: 270 },

  // Sports & Outdoors (8)
  { name: "Yoga Mat 6mm", description: "Non-slip TPE yoga mat with alignment lines and carry strap for home workouts.", price: 899, category: "Sports & Outdoors", imageUrl: "https://loremflickr.com/400/400/yogamat,fitness?lock=41", stock: 200 },
  { name: "Resistance Bands Set", description: "Set of 5 latex-free resistance bands with varying tension for full-body training.", price: 599, category: "Sports & Outdoors", imageUrl: "https://loremflickr.com/400/400/resistancebands,workout?lock=42", stock: 350 },
  { name: "Insulated Travel Mug 20oz", description: "Double-wall vacuum insulated mug with leak-proof lid, keeps drinks hot for hours.", price: 649, category: "Sports & Outdoors", imageUrl: "https://loremflickr.com/400/400/travelmug,insulated?lock=43", stock: 280 },
  { name: "Camping Headlamp", description: "Rechargeable LED headlamp with 3 modes, adjustable strap and IPX4 waterproof rating.", price: 549, category: "Sports & Outdoors", imageUrl: "https://loremflickr.com/400/400/headlamp,camping?lock=44", stock: 220 },
  { name: "Foam Roller 18\"", description: "High-density foam roller for muscle recovery, deep tissue massage and flexibility.", price: 699, category: "Sports & Outdoors", imageUrl: "https://loremflickr.com/400/400/foamroller,massage?lock=45", stock: 170 },
  { name: "Jump Rope Speed", description: "Adjustable speed jump rope with ball bearings and foam grips for cardio training.", price: 399, category: "Sports & Outdoors", imageUrl: "https://loremflickr.com/400/400/jumprope,fitness?lock=46", stock: 300 },
  { name: "Hiking Daypack 25L", description: "Lightweight daypack with hydration sleeve, rain cover and multiple compartments.", price: 1299, category: "Sports & Outdoors", imageUrl: "https://loremflickr.com/400/400/daypack,hiking?lock=47", stock: 120 },
  { name: "Swim Goggles Anti-Fog", description: "Anti-fog UV protection swim goggles with adjustable strap and wide vision.", price: 449, category: "Sports & Outdoors", imageUrl: "https://loremflickr.com/400/400/swimgoggles,swimming?lock=48", stock: 250 },

  // Beauty (8)
  { name: "Vitamin C Serum 30ml", description: "Brightening vitamin C serum with hyaluronic acid for glowing, even-toned skin.", price: 699, category: "Beauty", imageUrl: "https://loremflickr.com/400/400/serum,skincare?lock=49", stock: 200 },
  { name: "Bamboo Makeup Remover Pads", description: "Reusable set of 12 bamboo rounds, washable, eco-friendly and gentle on skin.", price: 449, category: "Beauty", imageUrl: "https://loremflickr.com/400/400/makeuppads,bamboo?lock=50", stock: 300 },
  { name: "Shea Butter Lip Balm (3-Pack)", description: "Moisturizing lip balm with shea butter and vitamin E, keeps lips soft all day.", price: 299, category: "Beauty", imageUrl: "https://loremflickr.com/400/400/lipbalm,beauty?lock=51", stock: 500 },
  { name: "Hair Styling Gel Strong Hold", description: "Alcohol-free strong hold gel that gives all-day styling without flaking.", price: 349, category: "Beauty", imageUrl: "https://loremflickr.com/400/400/hairgel,styling?lock=52", stock: 350 },
  { name: "Facial Cleanser Gentle", description: "pH-balanced gentle foaming cleanser for sensitive skin, removes dirt without drying.", price: 549, category: "Beauty", imageUrl: "https://loremflickr.com/400/400/cleanser,facial?lock=53", stock: 220 },
  { name: "Sunscreen SPF 50", description: "Broad-spectrum SPF 50 sunscreen that is water-resistant, non-greasy and PA+++.", price: 499, category: "Beauty", imageUrl: "https://loremflickr.com/400/400/sunscreen,spf?lock=54", stock: 250 },
  { name: "Retinol Night Cream", description: "Anti-aging night cream with retinol and peptides to reduce fine lines overnight.", price: 999, category: "Beauty", imageUrl: "https://loremflickr.com/400/400/nightcream,retinol?lock=55", stock: 150 },
  { name: "Natural Loofah Sponge Set", description: "Set of 3 biodegradable loofah sponges for body exfoliation and gentle scrubbing.", price: 299, category: "Beauty", imageUrl: "https://loremflickr.com/400/400/loofah,sponge?lock=56", stock: 400 },

  // Toys (5)
  { name: "Building Block Set 500pc", description: "Compatible interlocking building blocks, a creative play set for kids of all ages.", price: 1099, category: "Toys", imageUrl: "https://loremflickr.com/400/400/blocks,building?lock=57", stock: 150 },
  { name: "RC Racing Car", description: "High-speed remote control car with rechargeable battery and durable chassis.", price: 1299, category: "Toys", imageUrl: "https://loremflickr.com/400/400/rccar,toy?lock=58", stock: 100 },
  { name: "Wooden Puzzle 1000pc", description: "Jigsaw puzzle featuring a beautiful landscape scene, challenging and relaxing.", price: 549, category: "Toys", imageUrl: "https://loremflickr.com/400/400/puzzle,jigsaw?lock=59", stock: 200 },
  { name: "Plush Teddy Bear Large", description: "Soft 18-inch plush teddy bear, the perfect cuddle companion for children.", price: 799, category: "Toys", imageUrl: "https://loremflickr.com/400/400/teddybear,plush?lock=60", stock: 180 },
  { name: "Board Game Strategy", description: "Award-winning strategy board game for 2-4 players, great for family game night.", price: 1499, category: "Toys", imageUrl: "https://loremflickr.com/400/400/boardgame,strategy?lock=61", stock: 90 },

  // Grocery (5)
  { name: "Organic Green Tea (100 Bags)", description: "Premium organic green tea bags, individually wrapped for freshness and flavor.", price: 449, category: "Grocery", imageUrl: "https://loremflickr.com/400/400/greentea,beverage?lock=62", stock: 400 },
  { name: "Raw Almonds 500g Bag", description: "Premium raw almonds, unsalted and unroasted, rich in protein and healthy fats.", price: 349, category: "Grocery", imageUrl: "https://loremflickr.com/400/400/almonds,nuts?lock=63", stock: 300 },
  { name: "Extra Virgin Olive Oil 500ml", description: "Cold-pressed extra virgin olive oil, ideal for salads, cooking and dressings.", price: 549, category: "Grocery", imageUrl: "https://loremflickr.com/400/400/oliveoil,kitchen?lock=64", stock: 200 },
  { name: "Dark Chocolate 85% (3-Pack)", description: "Single-origin dark chocolate bars with 85% cacao, rich and low in sugar.", price: 449, category: "Grocery", imageUrl: "https://loremflickr.com/400/400/chocolate,dark?lock=65", stock: 250 },
  { name: "Honey Raw Unfiltered 500g", description: "Raw unfiltered honey with natural enzymes, great with tea, toast or curd.", price: 499, category: "Grocery", imageUrl: "https://loremflickr.com/400/400/honey,natural?lock=66", stock: 180 },

  // Automotive (4)
  { name: "Car Phone Mount", description: "Adjustable car phone mount with strong suction cup, one-hand release and 360 rotation.", price: 549, category: "Automotive", imageUrl: "https://loremflickr.com/400/400/phonemount,car?lock=67", stock: 250 },
  { name: "Microfiber Cleaning Cloths (10-Pack)", description: "Lint-free microfiber towels for car detailing, streak-free and highly absorbent.", price: 349, category: "Automotive", imageUrl: "https://loremflickr.com/400/400/microfibercloth,cleaning?lock=68", stock: 400 },
  { name: "Car Air Freshener (4-Pack)", description: "Long-lasting vanilla-scented car air fresheners that keep your cabin fresh.", price: 299, category: "Automotive", imageUrl: "https://loremflickr.com/400/400/airfreshener,car?lock=69", stock: 500 },
  { name: "Trunk Organizer Collapsible", description: "Multi-compartment collapsible trunk organizer with lid, keeps your boot tidy.", price: 849, category: "Automotive", imageUrl: "https://loremflickr.com/400/400/trunkorganizer,car?lock=70", stock: 120 },

  // Health (3)
  { name: "Digital Thermometer", description: "Instant-read digital thermometer with fever alarm and memory function.", price: 349, category: "Health", imageUrl: "https://loremflickr.com/400/400/thermometer,medical?lock=71", stock: 300 },
  { name: "Pill Organizer Weekly", description: "7-day pill organizer with labeled compartments to keep your medication routine on track.", price: 249, category: "Health", imageUrl: "https://loremflickr.com/400/400/pillbox,medical?lock=72", stock: 350 },
  { name: "Hand Grip Strengthener", description: "Adjustable hand grip strengthener with 10-40kg resistance for forearm training.", price: 449, category: "Health", imageUrl: "https://loremflickr.com/400/400/gripper,fitness?lock=73", stock: 200 },
];

export const discountCodes: SeedDiscountCode[] = [
  { code: "SAVE10", percentage: 10 },
  { code: "WELCOME20", percentage: 20 },
  { code: "FREESHIP15", percentage: 15 },
  { code: "HOLIDAY30", percentage: 30 },
  { code: "FLAT5", percentage: 5 },
];
