import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiForbiddenResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { EventSlotsService } from '../event-slots/event-slots.service';
import { EventSlotsResponseDto } from 'src/event-slots/dto/slot-availability-response.dto';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateEventDto } from './dto/update-event.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { ReservationResponseDto } from '../reservations/dto/reservation-response.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventSlotsService: EventSlotsService,
    private readonly eventsService: EventsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: '이벤트 생성',
    description: '관리자 권한으로 이벤트를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '이벤트 생성 성공',
  })
  @ApiForbiddenResponse({
    description: '권한 없음',
  })
  create(@Body() dto: CreateEventDto, @CurrentUser('id') userId: string) {
    return this.eventsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: '이벤트 목록 조회',
    description:
      '이벤트 목록을 조회합니다. track 및 organizationId 필터를 지원합니다.',
  })
  @ApiQuery({
    name: 'track',
    required: false,
    description: '트랙 필터',
    example: 'FRONTEND',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: '조직 ID 필터',
  })
  @ApiResponse({
    status: 200,
    description: '이벤트 목록 조회 성공',
  })
  findAll(
    @Query('track') track?: string,
    @CurrentUser('id') userId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.eventsService.findAll(track, userId, organizationId);
  }

  @Get(':id/slots')
  @ApiOperation({
    summary: '이벤트 슬롯 목록 조회 (초기 로드용)',
    description:
      '특정 이벤트의 모든 슬롯과 정원 정보를 조회 (예약 페이지 첫 로드 시 사용)',
  })
  @ApiParam({
    name: 'id',
    description: '이벤트 ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '슬롯 목록 조회 성공',
    type: EventSlotsResponseDto,
  })
  async getSlotsWithAvailability(@Param('id', ParseIntPipe) id: number) {
    return this.eventSlotsService.findByEventWithAvailability(id);
  }

  @Get(':id/polling-status')
  @ApiOperation({
    summary: '이벤트 폴링 상태 조회',
    description:
      '슬롯 정원 + 내 예약 정보를 한 번에 조회합니다. (폴링용 통합 API)',
  })
  @ApiParam({
    name: 'id',
    description: '이벤트 ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '폴링 상태 조회 성공',
  })
  async getPollingStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId?: string,
  ) {
    const [slotAvailability, myReservation] = await Promise.all([
      this.eventSlotsService.getAvailabilityByEvent(id),
      userId
        ? this.reservationsService.findByUserAndEvent(userId, id)
        : Promise.resolve(null),
    ]);

    return {
      slotAvailability,
      myReservation: myReservation
        ? new ReservationResponseDto(myReservation)
        : null,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: '이벤트 상세 조회',
    description: '이벤트 ID로 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '이벤트 ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '이벤트 상세 조회 성공',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId?: string,
  ) {
    return this.eventsService.findOne(id, userId);
  }

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '이벤트 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '이벤트 없음' })
  async updateEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '이벤트 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '예약이 있어 삭제 불가' })
  @ApiResponse({ status: 404, description: '이벤트 없음' })
  async deleteEvent(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.delete(id);
  }
}
