import 'dotenv/config';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import { Pool } from 'pg';
import { AppModule } from './app.module';
import { envSchema } from './infrastructure/config/env.schema';

async function bootstrap(): Promise<void> {
  const env = envSchema.parse(process.env);
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const PgSession = connectPgSimple(session);

  const app = await NestFactory.create(AppModule, { bodyParser: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    session({
      store: new PgSession({
        pool,
        createTableIfMissing: true,
        tableName: 'session',
      }),
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      name: 'lifeos_session',
      cookie: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000,
      },
    }),
  );

  app.enableCors({
    origin: env.WEB_ORIGIN,
    credentials: true,
  });

  await app.listen(env.PORT);
}

void bootstrap();
