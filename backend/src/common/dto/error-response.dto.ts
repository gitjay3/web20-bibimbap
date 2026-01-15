import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP 상태 코드' })
  statusCode: number;

  @ApiProperty({ example: '에러 메시지', description: '에러 메시지' })
  message: string;

  @ApiProperty({ example: 'Bad Request', description: '에러 타입' })
  error: string;
}
