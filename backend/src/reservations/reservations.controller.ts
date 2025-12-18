import { Controller, Post, Body } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  async createReservation(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    return this.reservationsService.createReservation(createReservationDto);
  }
}
