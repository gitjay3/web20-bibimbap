import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { EventSlotsService } from '../event-slots/event-slots.service';
import { EventSlotsResponseDto } from 'src/event-slots/dto/slot-availability-response.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventSlotsService: EventSlotsService,
    private readonly eventsService: EventsService,
  ) {}

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

  @Get()
  findAll(@Query('track') track?: string) {
    return this.eventsService.findAll(track);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.eventsService.findOne(id);
  }
}
