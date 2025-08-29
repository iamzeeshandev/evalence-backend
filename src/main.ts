import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './config/config.type';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { staticAssetsConfig } from './config/static-assets.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(staticAssetsConfig.rootPath, {
    prefix: staticAssetsConfig.serveRoot,
  });
  app.useGlobalPipes(new ValidationPipe());
  const configService = app.get(ConfigService<AllConfigType>);
  const config = new DocumentBuilder()
    .setTitle('Evalence API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addTag('evalence')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.enableCors({
    origin: 'http://localhost:3020',
    credentials: true,
  });
  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
