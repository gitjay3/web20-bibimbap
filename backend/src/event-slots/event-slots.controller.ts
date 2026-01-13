import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { EventSlotsService } from './event-slots.service';
import { AvailabilityOnlyResponseDto } from './dto/slot-availability-response.dto';

@ApiTags('event-slots')
@Controller('event-slots')
export class EventSlotsController {
  constructor(private readonly eventSlotsService: EventSlotsService) {}

  @Get('availability')
  @ApiOperation({
    summary: '실시간 정원 조회',
    description: '특정 슬롯들의 실시간 정원 정보만 빠르게 조회합니다.(폴링용)',
  })
  @ApiQuery({
    name: 'eventId',
    description: '이벤트 ID (해당 이벤트의 모든 슬롯 조회)',
    required: false,
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'slotIds',
    description: '조회할 슬롯 ID 목록 (쉼표로 구분)',
    example: '1,2,3',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '정원 정보 조회 성공',
    type: AvailabilityOnlyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'eventId 또는 slotIds 중 하나는 필수',
  })
  async getAvailability(
    @Query('eventId', new ParseIntPipe({ optional: true }))
    eventId?: number,
    @Query('slotIds')
    slotIds?: string,
  ) {
    if (eventId) {
      return this.eventSlotsService.getAvailabilityByEvent(eventId);
    }

    if (slotIds) {
      if (!slotIds || slotIds.trim() === '') {
        throw new BadRequestException('slotIds는 비어있을 수 없습니다');
      }
      const ids = slotIds.split(',').map((id) => {
        const parsed = parseInt(id.trim(), 10);
        if (isNaN(parsed)) {
          throw new BadRequestException(`유효하지 않은 slotId: ${id}`);
        }
        return parsed;
      });
      return this.eventSlotsService.getAvailability(ids);
    }

    throw new BadRequestException('식별 ID는 필수입니다.');
  }
}
