import { ApiProperty } from '@nestjs/swagger';
import { Track, PreRegStatus } from '@prisma/client';

export class CamperDto {
  @ApiProperty({ description: '유일 식별자 (UUID)', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: '부스트캠프 ID', example: 'J000' })
  camperId: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: 'GitHub ID', example: 'gildong' })
  username: string;

  @ApiProperty({ description: '분야', enum: Track, example: Track.WEB })
  track: Track;

  @ApiProperty({
    description: '등록 상태',
    enum: PreRegStatus,
    example: PreRegStatus.INVITED,
  })
  status: PreRegStatus;

  @ApiProperty({ description: '그룹 번호', example: 1, required: false })
  groupNumber?: number | null;
}
