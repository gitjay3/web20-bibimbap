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
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    QueueModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsProcessor],
  exports: [ReservationsService],
})
export class ReservationsModule {}
