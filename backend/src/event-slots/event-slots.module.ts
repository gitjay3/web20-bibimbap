import { Module } from '@nestjs/common';
import { EventSlotsController } from './event-slots.controller';
import { EventSlotsService } from './event-slots.service';

@Module({
  controllers: [EventSlotsController],
  providers: [EventSlotsService],
  exports: [EventSlotsService],
})
export class EventSlotsModule {}
