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
  IsIn,
} from 'class-validator';

type SlotFieldType = 'text' | 'number' | 'date' | 'time';

class CreateEventSlotDto {
  @IsInt()
  @Min(1)
  maxCapacity: number;

  @IsObject()
  extraInfo: Record<string, any>;
}

class SlotSchemaFieldDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['text', 'number', 'date', 'time'])
  type: SlotFieldType;
}

class SlotSchemaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotSchemaFieldDto)
  fields: SlotSchemaFieldDto[];
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

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

  @ValidateNested()
  @Type(() => SlotSchemaDto)
  slotSchema: SlotSchemaDto;

  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventSlotDto)
  slots: CreateEventSlotDto[];
}
