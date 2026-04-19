import 'dotenv/config';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from './presentation/http/filters/http-exception.filter';
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
  app.useGlobalFilters(new HttpExceptionFilter());

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
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
      if (origin === env.WEB_ORIGIN) {
        callback(null, origin);
        return;
      }
      if (env.NODE_ENV !== 'production') {
        // Vite may use 5174, 5175, … if 5173 is taken; still same machine.
        if (
          origin &&
          (/^https?:\/\/localhost:\d+$/.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin))
        ) {
          callback(null, origin);
          return;
        }
      }
      if (!origin) {
        callback(null, env.WEB_ORIGIN);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  await app.listen(env.PORT);
}

void bootstrap();
