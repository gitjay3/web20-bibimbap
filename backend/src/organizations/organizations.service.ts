import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, PreRegStatus, Track } from '@prisma/client';
import { CreateCamperDto } from './dto/create-camper.dto';
import { UpdateCamperDto } from './dto/update-camper.dto';
import { Workbook } from 'exceljs';

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

  async updateCamper(orgId: string, id: string, dto: UpdateCamperDto) {
    const existing = await this.prisma.camperPreRegistration.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== orgId) {
      throw new NotFoundException('캠퍼 정보를 찾을 수 없습니다.');
    }

    // 중복 체크 (본인 제외)
    if (dto.camperId || dto.username) {
      const conflict = await this.prisma.camperPreRegistration.findFirst({
        where: {
          organizationId: orgId,
          id: { not: id },
          OR: [
            dto.camperId ? { camperId: dto.camperId } : {},
            dto.username ? { username: dto.username } : {},
          ].filter((q) => Object.keys(q).length > 0),
        },
      });

      if (conflict) {
        const field =
          conflict.camperId === dto.camperId ? '부스트캠프 ID' : 'GitHub ID';
        throw new ConflictException(`이미 사용 중인 ${field}입니다.`);
      }
    }

    const updated = await this.prisma.camperPreRegistration.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        camperId: true,
        name: true,
        username: true,
        track: true,
        status: true,
      },
    });

    return updated;
  }

  async getCamperTemplate() {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Campers');

    // 헤더 설정
    worksheet.columns = [
      { header: '부스트캠프 ID', key: 'camperId', width: 20 },
      { header: '이름', key: 'name', width: 15 },
      { header: 'GitHub ID', key: 'username', width: 20 },
      { header: '분야', key: 'track', width: 15 },
    ];

    // 헤더 스타일링 (선택 사항)
    worksheet.getRow(1).font = { bold: true };

    // 데이터 유효성 검사 추가 (분야 열)
    // 2행부터 1000행까지 드롭다운 적용
    for (let i = 2; i <= 1000; i++) {
      worksheet.getCell(`D${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"WEB,ANDROID,IOS"'], // 엑셀에서 쉼표로 구분된 문자열 리스트
        showErrorMessage: true,
        errorTitle: '유효하지 않은 분야',
        error: 'WEB, ANDROID, IOS 중에서 선택해주세요.',
      };
    }

    return workbook.xlsx.writeBuffer();
  }

  async removeCamper(orgId: string, id: string) {
    const existing = await this.prisma.camperPreRegistration.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== orgId) {
      throw new NotFoundException('캠퍼 정보를 찾을 수 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. PreRegistration의 상태를 REVOKED로 변경
      const updated = await tx.camperPreRegistration.update({
        where: { id },
        data: { status: PreRegStatus.REVOKED },
      });

      // 2. 이미 가입된 상태였다면 조직 멤버십에서도 삭제
      if (existing.status === PreRegStatus.CLAIMED && existing.claimedUserId) {
        await tx.camperOrganization.delete({
          where: {
            userId_organizationId: {
              userId: existing.claimedUserId,
              organizationId: orgId,
            },
          },
        });
      }

      return updated;
    });
  }

  async uploadCampers(organizationId: string, fileBuffer: Buffer) {
    const workbook = new Workbook();
    // Buffer type mismatch fix: Buffer.from or cast to any
    await workbook.xlsx.load(fileBuffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('유효하지 않은 엑셀 파일입니다.');
    }

    const campersData: {
      camperId: string;
      name: string;
      username: string;
      track: Track;
    }[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 건너뛰기

      const camperId = row.getCell(1).text?.trim();
      const name = row.getCell(2).text?.trim();
      const username = row.getCell(3).text?.trim();
      const trackRaw = row.getCell(4).text?.trim()?.toUpperCase();

      if (!camperId || !name || !username || !trackRaw) return;

      const track = trackRaw as Track;
      if (!Object.values(Track).includes(track)) return;

      campersData.push({ camperId, name, username, track });
    });

    if (campersData.length === 0) {
      throw new BadRequestException('업로드할 캠퍼 정보가 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const data of campersData) {
        // 부스트캠프 ID(camperId)를 기준으로 Upsert
        const result = await tx.camperPreRegistration.upsert({
          where: {
            organizationId_camperId: {
              organizationId,
              camperId: data.camperId,
            },
          },
          update: {
            name: data.name,
            username: data.username,
            track: data.track,
          },
          create: {
            ...data,
            organizationId,
            status: PreRegStatus.INVITED,
          },
        });
        results.push(result);
      }
      return results;
    });
  }
}
