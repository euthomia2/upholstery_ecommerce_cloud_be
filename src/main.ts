import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config(); // Load environment variables from .env
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.use(cookieParser());
  app.enableCors({
    origin: ['https://ccldo-web-portal-njytd.ondigitalocean.app', 'https://rtcu-ecommerce-xqj88.ondigitalocean.app', 'https://api.semaphore.co/api/v4', 'https://ccldo-web-portal-slv5u.ondigitalocean.app', 'https://rtcu-ecommerce-ulb5k.ondigitalocean.app'],
    credentials: true,
  });
  await app.listen(3000);
}
bootstrap();
