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

async function main() {
  console.log('🌱 Seeding Zava database...');

  // Clean existing data
  await prisma.review.deleteMany();
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
  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'Maya Chen',
      role: 'customer',
    },
  });

  // Create additional reviewer
  const reviewer = await prisma.user.create({
    data: {
      email: 'reviewer@example.com',
      password: customerPassword,
      name: 'Alex Rivera',
      role: 'customer',
    },
  });

  // Create products
  const createdProducts = [];
  for (const product of products) {
    createdProducts.push(await prisma.product.create({ data: product }));
  }

  // Create sample reviews
  const reviews = [
    { productIdx: 0, userId: customer.id, rating: 5, text: 'Incredible espresso blend. The dark cacao notes really come through in a flat white.', status: 'approved' },
    { productIdx: 0, userId: reviewer.id, rating: 4, text: 'Very smooth with a nice finish. A bit pricey but worth it for special mornings.', status: 'approved' },
    { productIdx: 3, userId: customer.id, rating: 5, text: 'Beautiful design and the ceramic dripper produces a perfectly clean cup every time.', status: 'approved' },
    { productIdx: 5, userId: reviewer.id, rating: 4, text: 'Keeps coffee hot for hours. The clay finish looks even better in person.', status: 'approved' },
    { productIdx: 1, userId: customer.id, rating: 4, text: 'Great daily driver. The bergamot lift is subtle but adds a nice complexity.', status: 'pending' },
  ];

  for (const review of reviews) {
    await prisma.review.create({
      data: {
        productId: createdProducts[review.productIdx].id,
        userId: review.userId,
        rating: review.rating,
        text: review.text,
        status: review.status,
      },
    });
  }

  console.log(`✅ Seeded ${products.length} products, 3 users, ${reviews.length} reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
