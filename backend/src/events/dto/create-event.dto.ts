import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateEventSlotDto {
  @IsInt()
  @Min(1)
  maxCapacity: number;

  @IsObject()
  extraInfo: Record<string, any>;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  slotStartTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  slotEndTime?: Date;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @IsObject()
  slotSchema: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventSlotDto)
  slots: CreateEventSlotDto[];
}
