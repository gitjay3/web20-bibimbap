import { PartialType } from '@nestjs/swagger';
import { CreateCamperDto } from './create-camper.dto';

export class UpdateCamperDto extends PartialType(CreateCamperDto) {}
