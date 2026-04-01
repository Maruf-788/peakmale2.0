/* =====================================================
   PEAKMALE — seed.js
   Seeds DB with products + admin user
   Run: node seed.js
   ===================================================== */

'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('./models/Product');
const User     = require('./models/User');

const products = [
  {
    name:        "Minecraft Diamond Sword",
    category:    "gaming",
    price:       1499,
    comparePrice: 1999,
    rating:       5,
    ratingCount:  128,
    stock:        50,
    description:  "3D printed replica, 60cm length. Iconic blue diamond finish.",
    image:        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80",
    badge:        "⚔️ Gaming",
    tags:         ["minecraft", "gaming", "3d-print", "sword"],
    isFeatured:   true,
  },
  {
    name:        "Minecraft Pickaxe Replica",
    category:    "gaming",
    price:       999,
    comparePrice: 1299,
    rating:       4,
    ratingCount:  96,
    stock:        40,
    description:  "3D printed pickaxe, 55cm. Perfect desk or wall display piece.",
    image:        "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&q=80",
    badge:        "⚔️ Gaming",
    tags:         ["minecraft", "gaming", "3d-print", "pickaxe"],
    isFeatured:   true,
  },
  {
    name:        "Among Us Crewmate Figure",
    category:    "gaming",
    price:       799,
    rating:      5,
    ratingCount: 74,
    stock:       60,
    description: "15cm figure with LED glowing base. Looks amazing in the dark.",
    image:       "https://images.unsplash.com/photo-1596727147705-61a532a659bd?w=500&q=80",
    badge:       "⚔️ Gaming",
    tags:        ["among-us", "gaming", "figurine", "led"],
    isFeatured:  true,
  },
  {
    name:        "Cyberpunk Katana Replica",
    category:    "gaming",
    price:       2499,
    comparePrice: 2999,
    rating:       5,
    ratingCount:  52,
    stock:        25,
    description:  "Decorative 70cm katana. Neon accented handle. Wall-mount included.",
    image:        "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500&q=80",
    badge:        "⚔️ Gaming",
    tags:         ["cyberpunk", "katana", "gaming", "decoration"],
    isFeatured:   true,
  },
  {
    name:        "Zelda Master Sword",
    category:    "gaming",
    price:       1599,
    rating:      5,
    ratingCount: 89,
    stock:       35,
    description: "3D printed, 65cm. Faithful replica of the legendary Hylian blade.",
    image:       "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80",
    badge:       "⚔️ Gaming",
    tags:        ["zelda", "gaming", "3d-print", "sword"],
    isFeatured:  true,
  },
  {
    name:        "Gaming Controller Wall Mount",
    category:    "gaming",
    price:       449,
    rating:      4,
    ratingCount: 163,
    stock:       100,
    description: "Acrylic wall mount. Fits PS, Xbox & Nintendo controllers.",
    image:       "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=500&q=80",
    badge:       "⚔️ Gaming",
    tags:        ["controller", "wall-mount", "gaming", "accessory"],
    isFeatured:  false,
  },
  {
    name:        "RGB LED Desk Lamp",
    category:    "tech",
    price:       599,
    rating:      4,
    ratingCount: 210,
    stock:       80,
    description: "Adjustable brightness, 16M colors. Perfect gaming desk companion.",
    image:       "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80",
    badge:       "🔧 Tech",
    tags:        ["led", "desk-lamp", "rgb", "tech", "gaming"],
    isFeatured:  true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({ email: process.env.ADMIN_EMAIL });

    // Seed products
    const inserted = await Product.insertMany(products);
    console.log(`✅ ${inserted.length} products seeded`);

    // Seed admin user
    const admin = await User.create({
      name:     'PeakMale Admin',
      email:    process.env.ADMIN_EMAIL    || 'admin@peakmale.in',
      password: process.env.ADMIN_PASSWORD || 'Admin@PeakMale2024!',
      role:     'admin',
      phone:    '9999999999',
    });
    console.log(`✅ Admin created: ${admin.email}`);

    console.log('\n🚀 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
