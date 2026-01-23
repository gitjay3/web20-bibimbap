import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsProcessor } from './reservations.processor';
import { RESERVATION_QUEUE } from './dto/reservation-job.dto';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: RESERVATION_QUEUE,
    }),
    QueueModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsProcessor],
})
export class ReservationsModule {}
