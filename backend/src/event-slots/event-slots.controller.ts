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
import { Patch, Delete, Param, Body } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { Role } from '@prisma/client';
import { UpdateEventSlotDto } from './dto/update-event-slot.dto';
import { Post } from '@nestjs/common';
import { CreateEventSlotDto } from './dto/create-event-slot.dto';

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

  @Patch(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '슬롯 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 404, description: '슬롯 없음' })
  async updateSlot(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEventSlotDto,
  ) {
    return this.eventSlotsService.update(id, updateDto);
  }

  @Delete(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '슬롯 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '예약이 있어 삭제 불가' })
  @ApiResponse({ status: 404, description: '슬롯 없음' })
  async deleteSlot(@Param('id', ParseIntPipe) id: number) {
    return this.eventSlotsService.delete(id);
  }

  @Post()
  @Auth(Role.ADMIN)
  @ApiOperation({ summary: '슬롯 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @ApiResponse({ status: 404, description: '이벤트 없음' })
  async createSlot(@Body() createDto: CreateEventSlotDto) {
    return this.eventSlotsService.create(createDto);
  }
}
