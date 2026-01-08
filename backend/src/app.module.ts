import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ReservationsModule } from './reservations/reservations.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [EventEmitterModule.forRoot(), PrismaModule, ReservationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
