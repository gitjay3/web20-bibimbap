import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Bookstcamp API')
    .setDescription('북스트캠프 API 명세')
    .setVersion('1.0')
    .addTag('reservations', '예약 관련 API')
    .addTag('events', '이벤트 관련 API')
    .addTag('event-slots', '슬롯 정원 조회 API')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  // http://localhost:3000/api-docs

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
