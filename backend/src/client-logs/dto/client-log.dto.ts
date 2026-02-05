import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientLogDto {
  @ApiProperty({ description: '에러 메시지' })
  @IsString()
  message: string;

  @ApiProperty({ description: '스택 트레이스', required: false })
  @IsOptional()
  @IsString()
  stack?: string;

  @ApiProperty({ description: '에러 발생 URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: '브라우저 User Agent' })
  @IsString()
  userAgent: string;

  @ApiProperty({ description: '에러 발생 시간' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'React 컴포넌트 스택', required: false })
  @IsOptional()
  @IsString()
  componentStack?: string;

  @ApiProperty({ description: '추가 컨텍스트', required: false })
  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}
