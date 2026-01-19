import { ApplicationUnit, Track } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
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
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(Track)
  track?: Track;

  @IsOptional()
  @IsEnum(ApplicationUnit)
  applicationUnit?: ApplicationUnit;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @IsObject()
  slotSchema: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventSlotDto)
  slots: CreateEventSlotDto[];
}
