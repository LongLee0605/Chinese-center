import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  // Local: localhost. Production: CORS_ORIGINS (comma-separated). Cloudflare Pages: *.pages.dev cho cả production và preview URL.
  const originsFromEnv = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  const localhostOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
  const explicitOrigins = [...new Set([...localhostOrigins, ...originsFromEnv])];
  const cloudflarePagesRegex = /^https:\/\/([a-z0-9-]+\.)?chinese-center-(web|crm)\.pages\.dev$/;
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (explicitOrigins.includes(origin)) return callback(null, true);
      if (cloudflarePagesRegex.test(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`API running at http://localhost:${port}/api/v1`);
}

bootstrap().catch(console.error);
