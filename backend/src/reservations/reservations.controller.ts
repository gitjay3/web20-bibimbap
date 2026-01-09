import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  Sse,
  MessageEvent,
  Query,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ApplyReservationDto } from './dto/apply-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { Observable, fromEvent } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReservationStatusEvent } from './events/reservation-status.event';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  async apply(@Body() applyReservationDto: ApplyReservationDto) {
    // TODO: 인증 구현 후 실제 userId 가져오기
    const tempUserId = 'test-user-123';

    const reservation = await this.reservationsService.apply(
      tempUserId,
      applyReservationDto,
    );

    return new ReservationResponseDto(reservation);
  }

  @Get()
  async findAll() {
    // TODO: 인증 구현 후 실제 userId 가져오기
    const tempUserId = 'test-user-123';

    const reservations =
      await this.reservationsService.findAllByUser(tempUserId);
    return reservations.map((r) => new ReservationResponseDto(r));
  }

  @Sse('sse')
  sse(@Query('userId') userId?: string): Observable<MessageEvent> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return fromEvent(this.eventEmitter, 'reservation.status').pipe(
      map((event: ReservationStatusEvent) => ({
        data: {
          userId: event.userId,
          reservationId: event.reservationId,
          status: event.status,
          message: event.message,
          timestamp: event.timestamp,
        },
      })),
      filter((messageEvent) => messageEvent.data.userId === userId),
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const reservation = await this.reservationsService.findOne(id);

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return new ReservationResponseDto(reservation);
  }

  @Delete(':id')
  async cancel(@Param('id', ParseIntPipe) id: number) {
    // TODO: 인증 구현 후 실제 userId 가져오기
    const tempUserId = 'test-user-123';

    const reservation = await this.reservationsService.cancel(id, tempUserId);
    return new ReservationResponseDto(reservation);
  }
}
