import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ApplyReservationDto } from './dto/apply-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

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
    const reservation = await this.reservationsService.cancel(id);
    return new ReservationResponseDto(reservation);
  }
}
