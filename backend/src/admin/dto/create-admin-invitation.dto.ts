import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminInvitationDto {
  @ApiProperty({ description: 'GitHub username', example: 'newadmin' })
  @IsString()
  @IsNotEmpty()
  githubUsername: string;
}
