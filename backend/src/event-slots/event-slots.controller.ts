import { Controller, Get, Query, ParseArrayPipe } from '@nestjs/common';
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
  async getAvailability(
    @Query('slotIds', new ParseArrayPipe({ items: Number, separator: ',' }))
    slotIds: number[],
  ) {
    return this.eventSlotsService.getAvailability(slotIds);
  }
}
