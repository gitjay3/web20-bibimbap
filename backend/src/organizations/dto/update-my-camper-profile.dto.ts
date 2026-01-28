import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMyCamperProfileDto {
  @ApiPropertyOptional({ description: '슬랙 멤버 ID' })
  @IsString()
  @IsOptional()
  slackMemberId: string;
}
