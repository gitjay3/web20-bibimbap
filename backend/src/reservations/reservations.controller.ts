import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { ApplyReservationDto } from './dto/apply-reservation.dto';
import { ReservationResponseDto } from './dto/reservation-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { QueueTokenGuard } from '../queue/guards/queue-token.guard';
import { ThrottleReservation } from 'src/common/decorators/throttle.decorator';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ThrottleReservation()
  @ApiOperation({
    summary: '예약 신청',
    description: '이벤트 슬롯에 예약을 신청합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '예약 신청 성공',
    type: ReservationResponseDto,
  })
  @ApiBadRequestResponse({
    description: '정원 마감 또는 중복 예약',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '슬롯을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  @UseGuards(QueueTokenGuard)
  async apply(
    @CurrentUser('id') userId: string,
    @Body() applyReservationDto: ApplyReservationDto,
  ) {
    return this.reservationsService.apply(userId, applyReservationDto);
  }

  @Get()
  @ApiOperation({
    summary: '내 예약 목록 조회',
    description: '현재 사용자의 모든 예약을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '예약 목록 조회 성공',
    type: [ReservationResponseDto],
  })
  async findAll(@CurrentUser('id') userId: string) {
    const reservations = await this.reservationsService.findAllByUser(userId);
    return reservations.map((r) => new ReservationResponseDto(r));
  }

  @Get('my/:eventId')
  @ApiOperation({ summary: '특정 이벤트에 대한 내 예약 조회' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({ status: 200, type: ReservationResponseDto })
  async findMyReservationForEvent(
    @CurrentUser('id') userId: string,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    const reservation = await this.reservationsService.findByUserAndEvent(
      userId,
      eventId,
    );
    return reservation ? new ReservationResponseDto(reservation) : null;
  }

  @Get(':id')
  @ApiOperation({
    summary: '예약 상세 조회',
    description: 'ID로 특정 예약을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '예약 ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '예약 조회 성공',
    type: ReservationResponseDto,
  })
  @ApiNotFoundResponse({
    description: '예약을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const reservation = await this.reservationsService.findOne(id);

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (reservation.userId !== userId) {
      throw new ForbiddenException('이 예약을 조회할 권한이 없습니다.');
    }

    return new ReservationResponseDto(reservation);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '예약 취소',
    description: '예약을 취소합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '취소할 예약 ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '예약 취소 성공',
    type: ReservationResponseDto,
  })
  @ApiBadRequestResponse({
    description: '이미 취소된 예약',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '예약을 찾을 수 없음',
    type: ErrorResponseDto,
  })
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const reservation = await this.reservationsService.cancel(id, userId);
    return new ReservationResponseDto(reservation);
  }
}
