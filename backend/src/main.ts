import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  // Local: localhost (5173=website, 5174=CRM). Production: thêm từ CORS_ORIGINS (Vercel URLs)
  const originsFromEnv = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  const localhostOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
  const origins = [...new Set([...localhostOrigins, ...originsFromEnv])];
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
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
