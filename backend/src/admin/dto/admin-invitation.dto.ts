import { ApiProperty } from '@nestjs/swagger';
import { AdminInviteStatus } from '@prisma/client';

export class AdminInvitationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  githubUsername: string;

  @ApiProperty({ enum: AdminInviteStatus })
  status: AdminInviteStatus;

  @ApiProperty()
  invitedAt: Date;

  @ApiProperty({ required: false })
  acceptedAt?: Date;
}
