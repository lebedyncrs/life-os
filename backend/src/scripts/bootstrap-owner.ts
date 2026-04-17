import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

async function main(): Promise<void> {
  const [email, password, linkToken] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: pnpm run bootstrap:owner -- <email> <password> [telegramLinkToken]');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  await prisma.owner.create({
    data: {
      email,
      passwordHash: hashSync(password, 10),
      telegramLinkToken: linkToken ?? null,
    },
  });
  console.log('Owner created.');
  await prisma.$disconnect();
}

void main();
