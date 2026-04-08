import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  
  // Security and Performance Middleware
  app.use(helmet());
  app.use(compression());
  
  // Prefix all routes with /api
  app.setGlobalPrefix('api');
  
  // CORS Restricted for production
  app.enableCors({
    origin: process.env.FRONTEND_URL || true, // Restrict this in production
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
