import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReservationsModule } from './reservations/reservations.module';
import { EventSlotsModule } from './event-slots/event-slots.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { TemplatesModule } from './templates/templates.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsModule } from './metrics/metrics.module';
import { AdminModule } from './admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SlackModule } from './slack/slack.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OpenTelemetryModule } from 'nestjs-otel';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { LoggerModule } from 'nestjs-pino';
import { ClientLogsModule } from './client-logs/client-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('LOG_LEVEL', 'info'),
          transport:
            configService.get<string>('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true } }
              : undefined,
          autoLogging: true,
          redact: ['req.headers.cookie', 'req.headers.authorization'],
        },
      }),
      inject: [ConfigService],
    }),
    // Rate Limiting: 브루트포스 공격 방지
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1초
        limit: 5, // 초당 5회
      },
      {
        name: 'medium',
        ttl: 10000, // 10초
        limit: 30, // 10초당 30회
      },
      {
        name: 'long',
        ttl: 60000, // 1분
        limit: 100, // 분당 100회
      },
    ]),
    ScheduleModule.forRoot(),
    OpenTelemetryModule.forRoot({
      metrics: {
        hostMetrics: true,
      },
    }),
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    MetricsModule,
    RedisModule,
    EventsModule,
    ReservationsModule,
    EventSlotsModule,
    AuthModule,
    QueueModule,
    TemplatesModule,
    OrganizationsModule,
    SlackModule,
    NotificationsModule,
    AdminModule,
    ClientLogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
