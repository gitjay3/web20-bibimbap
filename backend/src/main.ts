import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from 'common/filters/global-exception.filter';

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
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Bookstcamp API')
    .setDescription('북스트캠프 API 명세')
    .setVersion('1.0')
    .addTag('auth', '인증 관련 API')
    .addTag('reservations', '예약 관련 API')
    .addTag('events', '이벤트 관련 API')
    .addTag('event-slots', '슬롯 정원 조회 API')
    .addTag('templates', '이벤트 템플릿 관리 API')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  document.security = [{ access_token: [] }];
  SwaggerModule.setup('api-docs', app, document, {
    useGlobalPrefix: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
