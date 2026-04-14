import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // SANITIZE HEADERS TO FIX CHARSET ISSUE
  app.use((req: any, res: any, next: any) => {
    if (req.headers['content-type']) {
      // Remove charset from content-type header because body-parser is failing on "UTF-8"
      req.headers['content-type'] = req.headers['content-type'].split(';')[0];
    }
    next();
  });
  
  // Security and Performance Middleware
  app.use(helmet());
  app.use(compression());
  
  // Prefix all routes with /api
  app.setGlobalPrefix('api');
  
  // Explicitly configure body-parser to avoid charset issues
  const express = require('express');
  app.use(express.json({ limit: '50mb', type: ['application/json', 'text/plain'] }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // CORS Restricted for production
  app.enableCors({
    origin: process.env.FRONTEND_URL || true, // Restrict this in production
    credentials: true,
  });

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Antigravity API')
    .setDescription('The Antigravity SaaS Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
