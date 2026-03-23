import { connectDB, User, Category, Product, Order, Return } from "@workspace/db";
import crypto from "crypto";

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw + "salt123").digest("hex");
}

async function seed() {
  console.log("Connecting to MongoDB...");
  await connectDB();
  console.log("Connected! Seeding database...");

  // Check if data already exists
  const existingBuyer = await User.findOne({ email: "buyer@example.com" });
  if (existingBuyer) {
    console.log("Data already seeded, skipping...");
    process.exit(0);
  }

  // Users
  const buyer = await User.create({
    name: "Alice Johnson",
    email: "buyer@example.com",
    passwordHash: hashPassword("password123"),
    role: "buyer",
    isApproved: true,
  });

  const seller = await User.create({
    name: "Bob's Electronics",
    email: "seller@example.com",
    passwordHash: hashPassword("password123"),
    role: "seller",
    isApproved: true,
  });

  const admin = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    passwordHash: hashPassword("password123"),
    role: "admin",
    isApproved: true,
  });

  const seller2 = await User.create({
    name: "Fashion Hub",
    email: "seller2@example.com",
    passwordHash: hashPassword("password123"),
    role: "seller",
    isApproved: true,
  });

  // Categories
  const electronics = await Category.create({ name: "Electronics", slug: "electronics", description: "Gadgets and tech" });
  const fashion = await Category.create({ name: "Fashion", slug: "fashion", description: "Clothing and accessories" });
  const home = await Category.create({ name: "Home & Garden", slug: "home-garden", description: "Home products" });
  const sports = await Category.create({ name: "Sports", slug: "sports", description: "Sports and fitness" });

  const productData = [
    { 
      name: "iPhone 15 Pro Max", 
      description: "Latest Apple flagship with titanium design, A17 Pro chip, and advanced camera system", 
      price: 1199.99, 
      stock: 50, 
      categoryId: electronics._id.toString(), 
      sellerId: seller._id.toString(), 
      status: "approved",
      images: [
        { url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600", isPrimary: true },
        { url: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600", isPrimary: false }
      ]
    },
    { 
      name: "Samsung 4K Smart TV 55\"", 
      description: "Crystal clear 4K display with smart OS, HDR10+, and built-in streaming apps", 
      price: 699.99, 
      stock: 30, 
      categoryId: electronics._id.toString(), 
      sellerId: seller._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600", isPrimary: true }]
    },
    { 
      name: "Sony WH-1000XM5 Headphones", 
      description: "Industry-leading noise cancellation with 30hr battery, premium sound quality", 
      price: 349.99, 
      stock: 80, 
      categoryId: electronics._id.toString(), 
      sellerId: seller._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", isPrimary: true }]
    },
    { 
      name: "MacBook Air M3", 
      description: "Incredibly thin and powerful laptop with M3 chip, 18hr battery life", 
      price: 1299.99, 
      stock: 25, 
      categoryId: electronics._id.toString(), 
      sellerId: seller._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600", isPrimary: true }]
    },
    { 
      name: "Premium Cotton T-Shirt", 
      description: "Soft 100% organic cotton tee, available in multiple colors, sustainable fabric", 
      price: 29.99, 
      stock: 200, 
      categoryId: fashion._id.toString(), 
      sellerId: seller2._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600", isPrimary: true }]
    },
    { 
      name: "Slim Fit Denim Jeans", 
      description: "Classic denim with stretch comfort, modern slim fit, multiple washes available", 
      price: 79.99, 
      stock: 150, 
      categoryId: fashion._id.toString(), 
      sellerId: seller2._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", isPrimary: true }]
    },
    { 
      name: "Running Shoes Pro", 
      description: "Lightweight performance running shoes with responsive cushioning and breathable mesh", 
      price: 129.99, 
      stock: 100, 
      categoryId: sports._id.toString(), 
      sellerId: seller2._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", isPrimary: true }]
    },
    { 
      name: "Yoga Mat Premium", 
      description: "Non-slip 6mm thick yoga mat with alignment lines, eco-friendly material", 
      price: 49.99, 
      stock: 75, 
      categoryId: sports._id.toString(), 
      sellerId: seller._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600", isPrimary: true }]
    },
    { 
      name: "Coffee Maker Deluxe", 
      description: "12-cup programmable coffee maker with built-in grinder and thermal carafe", 
      price: 149.99, 
      stock: 40, 
      categoryId: home._id.toString(), 
      sellerId: seller._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600", isPrimary: true }]
    },
    { 
      name: "Smart Home Hub", 
      description: "Control all your smart devices from one hub, compatible with Alexa and Google Home", 
      price: 89.99, 
      stock: 60, 
      categoryId: electronics._id.toString(), 
      sellerId: seller._id.toString(), 
      status: "pending",
      images: [{ url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600", isPrimary: true }]
    },
    { 
      name: "Wireless Earbuds Pro", 
      description: "True wireless earbuds with active noise cancellation, 36hr total battery, IPX5 water resistant", 
      price: 179.99, 
      stock: 90, 
      categoryId: electronics._id.toString(), 
      sellerId: seller._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600", isPrimary: true }]
    },
    { 
      name: "Leather Wallet", 
      description: "Slim genuine leather bifold wallet with RFID blocking, multiple card slots", 
      price: 39.99, 
      stock: 120, 
      categoryId: fashion._id.toString(), 
      sellerId: seller2._id.toString(), 
      status: "approved",
      images: [{ url: "https://images.unsplash.com/photo-1627123424574-724758594754?w=600", isPrimary: true }]
    },
  ];

  const insertedProducts = await Product.create(productData);

  // Create sample orders with embedded items
  if (insertedProducts.length >= 2) {
    const product1 = insertedProducts[0];
    const product2 = insertedProducts[4];
    const total = product1.price + product2.price;

    const order = await Order.create({
      buyerId: buyer._id.toString(),
      status: "delivered",
      totalAmount: total,
      shippingAddress: "123 Main St, San Francisco, CA 94102",
      items: [
        {
          productId: product1._id.toString(),
          quantity: 1,
          unitPrice: product1.price,
        },
        {
          productId: product2._id.toString(),
          quantity: 2,
          unitPrice: product2.price,
        }
      ]
    });

    // Create a return request with AI verification for demo
    const returnReq = await Return.create({
      orderId: order._id.toString(),
      orderItemId: order.items[0]._id.toString(),
      buyerId: buyer._id.toString(),
      reason: "Product looks different from description - screen has scratches",
      status: "manual_review",
      images: [
        { url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600" },
        { url: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600" }
      ],
      verificationResult: {
        verdict: "SUSPICIOUS",
        similarityScore: 0.6234,
        productIdentityMatch: true,
        packagingIntact: false,
        noVisibleDamage: false,
        correctProduct: true,
        fraudRisk: "medium",
      }
    });

    // Second order
    const product3 = insertedProducts[2];
    const order2 = await Order.create({
      buyerId: buyer._id.toString(),
      status: "shipped",
      totalAmount: product3.price,
      shippingAddress: "123 Main St, San Francisco, CA 94102",
      items: [
        {
          productId: product3._id.toString(),
          quantity: 1,
          unitPrice: product3.price,
        }
      ]
    });
  }

  console.log("✅ Database seeded successfully!");
  console.log("Demo accounts:");
  console.log("  Buyer:  buyer@example.com / password123");
  console.log("  Seller: seller@example.com / password123");
  console.log("  Admin:  admin@example.com / password123");
}

seed().catch(console.error).finally(() => process.exit(0));
