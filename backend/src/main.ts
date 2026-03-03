import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

// compression là CommonJS (module.exports = function), dùng require để runtime gọi đúng
const compression = require('compression') as (options?: unknown) => import('express').RequestHandler;

async function bootstrap() {
  // Cảnh báo: local không nên dùng database production (Render) – dễ gây lỗi ảnh, data lẫn lộn.
  if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL?.includes('onrender.com')) {
    console.warn(
      '\n⚠️  CẢNH BÁO: Bạn đang chạy LOCAL nhưng DATABASE_URL trỏ tới Render (production).\n' +
        '    Nên dùng database local (Docker / PostgreSQL máy) để tách biệt data và upload ảnh.\n' +
        '    Xem docs/HUONG-DAN-CHAY.md mục "Tách biệt Local và Production".\n',
    );
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
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
