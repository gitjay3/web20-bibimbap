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
import { ErrorResponseDto } from './dto/error-response.dto';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
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
  async apply(@Body() applyReservationDto: ApplyReservationDto) {
    const tempUserId = 'test-user-123';

    const reservation = await this.reservationsService.apply(
      tempUserId,
      applyReservationDto,
    );

    return new ReservationResponseDto(reservation);
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
  async findAll() {
    const tempUserId = 'test-user-123';

    const reservations =
      await this.reservationsService.findAllByUser(tempUserId);
    return reservations.map((r) => new ReservationResponseDto(r));
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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const reservation = await this.reservationsService.findOne(id);

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
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
  async cancel(@Param('id', ParseIntPipe) id: number) {
    const reservation = await this.reservationsService.cancel(id);
    return new ReservationResponseDto(reservation);
  }
}
