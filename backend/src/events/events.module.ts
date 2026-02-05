import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventSlotsModule } from '../event-slots/event-slots.module';
import { ReservationsModule } from '../reservations/reservations.module';

@Module({
  imports: [EventSlotsModule, ReservationsModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
