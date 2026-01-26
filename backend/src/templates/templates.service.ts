import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        title: dto.title,
        description: dto.description,
        slotSchema: dto.slotSchema as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findAll() {
    return this.prisma.template.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: number) {
    const template = await this.prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('존재하지 않는 템플릿입니다.');
    }

    return template;
  }

  async update(id: number, dto: UpdateTemplateDto) {
    await this.findOne(id);

    return this.prisma.template.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        slotSchema: dto.slotSchema as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.template.delete({
      where: { id },
    });
  }
}
