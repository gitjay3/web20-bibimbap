import { ApiProperty } from '@nestjs/swagger';

export class AdminMemberDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  avatarUrl?: string;
}
