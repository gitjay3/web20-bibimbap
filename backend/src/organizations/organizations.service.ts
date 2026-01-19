import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async findMyOrganizations(userId: string) {
    const userOrganizations = await this.prisma.camperOrganization.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    return userOrganizations.map((uo) => uo.organization);
  }
}
