import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Track } from '@prisma/client';

export class CreateCamperDto {
  @ApiProperty({ description: '부스트캠프 ID', example: 'J000' })
  @IsString()
  @IsNotEmpty()
  camperId: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'GitHub ID', example: 'gildong' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '분야', enum: Track, example: Track.WEB })
  @IsEnum(Track)
  @IsNotEmpty()
  track: Track;
}
