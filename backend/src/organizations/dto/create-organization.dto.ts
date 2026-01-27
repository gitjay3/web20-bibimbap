import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ description: '조직명', example: '부스트캠프 10기 멤버십' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
