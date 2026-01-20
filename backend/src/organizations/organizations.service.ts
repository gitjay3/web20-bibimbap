import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, PreRegStatus } from '@prisma/client';
import { CreateCamperDto } from './dto/create-camper.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('조직을 찾을 수 없습니다.');
    }

    return organization;
  }

  async findMyOrganizations(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.organization.findMany({
        orderBy: { name: 'asc' },
      });
    }

    const userOrganizations = await this.prisma.camperOrganization.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    return userOrganizations.map((uo) => uo.organization);
  }

  async findCampers(organizationId: string) {
    const campers = await this.prisma.camperPreRegistration.findMany({
      where: {
        organizationId,
        status: { not: PreRegStatus.REVOKED },
      },
      select: {
        id: true,
        camperId: true,
        name: true,
        username: true,
        track: true,
        status: true,
      },
      orderBy: { camperId: 'asc' },
    });
    return campers;
  }

  async createCamper(organizationId: string, dto: CreateCamperDto) {
    const existingCamper = await this.prisma.camperPreRegistration.findFirst({
      where: {
        organizationId,
        OR: [{ camperId: dto.camperId }, { username: dto.username }],
      },
    });

    if (existingCamper) {
      const field =
        existingCamper.camperId === dto.camperId
          ? '부스트캠프 ID'
          : 'GitHub ID';
      throw new ConflictException(`이미 해당 조직에 등록된 ${field}입니다.`);
    }

    const newCamper = await this.prisma.camperPreRegistration.create({
      data: {
        ...dto,
        organizationId,
        status: PreRegStatus.INVITED,
      },
      select: {
        id: true,
        camperId: true,
        name: true,
        username: true,
        track: true,
        status: true,
      },
    });

    return newCamper;
  }
}
