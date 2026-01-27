import { IsInt, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  @IsIn([5, 10, 30, 60])
  notificationTime: number;
}
