import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { hashSync } from 'bcryptjs';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const emailFromEnv = process.env.OWNER_BOOTSTRAP_EMAIL?.trim();
  const passwordFromEnv = process.env.OWNER_BOOTSTRAP_PASSWORD;

  const email = argv[0]?.trim() || emailFromEnv;
  const password = argv[1] || passwordFromEnv;
  const linkToken = argv[2] ?? process.env.OWNER_BOOTSTRAP_TELEGRAM_LINK_TOKEN ?? undefined;

  if (!email || !password) {
    console.error(
      'Missing email/password. Either pass CLI args or set env in backend/.env:\n' +
        '  pnpm run seed:owner -- <email> <password> [telegramLinkToken]\n' +
        '  pnpm run seed:owner   # uses OWNER_BOOTSTRAP_EMAIL + OWNER_BOOTSTRAP_PASSWORD',
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    await prisma.owner.create({
      data: {
        email,
        passwordHash: hashSync(password, 10),
        telegramLinkToken: linkToken?.trim() || null,
      },
    });
    console.log('Owner created.');
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      console.error('An owner with this email already exists.');
      process.exit(1);
    }
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
