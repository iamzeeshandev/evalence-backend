import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './config/config.type';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { staticAssetsConfig } from './config/static-assets.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();
console.log('=== Environment Variables Debug ===');
console.log('JWT_EXPIRY from process.env:', process.env.JWT_EXPIRY);
console.log(
  'JWT_SECRET from process.env:',
  process.env.JWT_SECRET ? 'SET' : 'NOT SET',
);
console.log('================================');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(staticAssetsConfig.rootPath, {
    prefix: staticAssetsConfig.serveRoot,
  });
  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService<AllConfigType>);
  const config = new DocumentBuilder()
    .setTitle('Evalence API')
    .setDescription('API documentation for Evalence application')
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('User', 'User management endpoints')
    .addTag('Company', 'Company management endpoints')
    .addTag('Test', 'Test management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter refresh token',
      },
      'refresh-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.enableCors({
    // origin: 'http://127.0.0.1:4444',
    origin: 'http://localhost:3020',
    credentials: true,
  });
  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
