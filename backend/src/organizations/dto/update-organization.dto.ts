import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    description: '조직명',
    example: '부스트캠프 10기 멤버십',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;
}
