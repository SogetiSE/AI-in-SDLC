import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface ProductSeed {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
}

const productSeeds: ProductSeed[] = [
  {
    name: 'Zava Atlas Espresso Blend',
    description: 'A structured espresso roast with dark cacao, candied orange, and a velvet finish built for flat whites and straight shots.',
    price: 1899,
    category: 'Coffee',
    stock: 80,
    imageUrl: '/images/products/atlas-espresso.svg',
  },
  {
    name: 'Zava Daybreak Filter Roast',
    description: 'A bright everyday brew with bergamot lift, caramel sweetness, and a clean finish for slow mornings and all-day refills.',
    price: 1799,
    category: 'Coffee',
    stock: 74,
    imageUrl: '/images/products/daybreak-filter.svg',
  },
  {
    name: 'Zava Solstice Cold Brew Flight',
    description: 'Three small-lot cold brew profiles designed for tasting pours, hosting trays, and a high-end retail demo shelf.',
    price: 2499,
    category: 'Coffee',
    stock: 48,
    imageUrl: '/images/products/solstice-cold-brew.svg',
  },
  {
    name: 'Zava Studio Pour-Over Kit',
    description: 'A matte ceramic dripper, borosilicate server, and measured filter set tuned for precise home brewing without visual clutter.',
    price: 12900,
    category: 'Brewing Gear',
    stock: 26,
    imageUrl: '/images/products/studio-pour-over-kit.svg',
  },
  {
    name: 'Zava Copper Drip Kettle',
    description: 'A premium gooseneck kettle with balanced pour control, induction compatibility, and a silhouette that reads well on stage.',
    price: 9200,
    category: 'Brewing Gear',
    stock: 19,
    imageUrl: '/images/products/copper-drip-kettle.svg',
  },
  {
    name: 'Zava Nomad Travel Tumbler',
    description: 'Double-wall insulated drinkware in a brushed clay finish that keeps espresso hot and the product shelf visually cohesive.',
    price: 4200,
    category: 'Accessories',
    stock: 65,
    imageUrl: '/images/products/nomad-tumbler.svg',
  },
  {
    name: 'Zava Evening Ritual Candle',
    description: 'A cedar, neroli, and espresso wax blend designed to extend the coffee ritual into hospitality, gifting, and evening ambiance.',
    price: 3600,
    category: 'Home Ritual',
    stock: 34,
    imageUrl: '/images/products/evening-ritual-candle.svg',
  },
  {
    name: 'Zava Canvas Market Tote',
    description: 'Heavyweight utility tote sized for beans, brewer gear, and a laptop so the brand extends naturally into work and travel.',
    price: 5400,
    category: 'Lifestyle',
    stock: 42,
    imageUrl: '/images/products/canvas-market-tote.svg',
  },
];

const products = productSeeds;

// Percentage codes; pricing caps any discount at 50%. RETIRED20 is inactive on purpose.
const discountCodes = [
  { code: 'WELCOME10', percentOff: 10, active: true },
  { code: 'BREW15', percentOff: 15, active: true },
  { code: 'RETIRED20', percentOff: 20, active: false },
];

async function main() {
  console.log('🌱 Seeding Zava database...');

  // Clean existing data
  await prisma.cartDiscount.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  await prisma.user.create({
    data: {
      email: 'admin@zava.com',
      password: adminPassword,
      name: 'Zava Admin',
      role: 'admin',
    },
  });

  // Create test customer
  const customerPassword = await bcrypt.hash('Customer123!', 10);
  await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'Maya Chen',
      role: 'customer',
    },
  });

  // Create products
  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  await prisma.discountCode.createMany({ data: discountCodes });

  console.log(`✅ Seeded ${products.length} products, 2 users, ${discountCodes.length} discount codes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
