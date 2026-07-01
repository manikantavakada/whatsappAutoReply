import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@seller.test';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Demo user already exists, skipping seed.');
    return;
  }

  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  const user = await prisma.user.create({
    data: {
      name: 'Demo Seller',
      email,
      passwordHash,
      businesses: {
        create: {
          name: 'Demo Apparel Co.',
          products: {
            create: [
              {
                name: 'Classic Black Shirt',
                description: 'Breathable cotton, slim fit. Great for everyday wear.',
                price: 699,
                sizes: ['S', 'M', 'L', 'XL'],
                colors: ['Black'],
              },
              {
                name: 'Classic Blue Shirt',
                description: 'Same fit as our bestseller, in navy blue.',
                price: 799,
                sizes: ['M', 'L'],
                colors: ['Blue'],
              },
              {
                name: 'Premium Polo',
                description: 'Pique cotton polo with embroidered logo.',
                price: 999,
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                colors: ['White', 'Maroon', 'Olive'],
              },
            ],
          },
        },
      },
    },
  });

  console.log(`Seeded demo account -> email: ${email}, password: Demo@1234, userId: ${user.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
