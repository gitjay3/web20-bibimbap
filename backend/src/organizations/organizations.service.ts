import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Role,
  PreRegStatus,
  Track,
  CamperPreRegistration,
} from '@prisma/client';
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

    // 1. 이미 CLAIMED 하여 CamperOrganization에 등록된 조직
    const userOrganizations = await this.prisma.camperOrganization.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });

    const claimedOrgIds = new Set(
      userOrganizations.map((uo) => uo.organizationId),
    );
    const organizations = [...userOrganizations.map((uo) => uo.organization)];

    // 2. 로그인은 했고 PreRegistration에는 등록되었으나 아직 CLAIMED 하지 않은 조직 탐색
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    if (user?.username) {
      const preRegOrgs = await this.prisma.camperPreRegistration.findMany({
        where: {
          username: user.username,
          status: PreRegStatus.INVITED, // 아직 등록 안된 초대장만
          organizationId: { notIn: Array.from(claimedOrgIds) },
        },
        include: {
          organization: true,
        },
      });

      preRegOrgs.forEach((pre) => {
        if (!claimedOrgIds.has(pre.organizationId)) {
          organizations.push(pre.organization);
          claimedOrgIds.add(pre.organizationId);
        }
      });
    }

    return organizations;
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
        groupNumber: true,
      },
      orderBy: { camperId: 'asc' },
    });
    return campers;
  }

  async createCamper(organizationId: string, dto: CreateCamperDto) {
    const existingActiveCamper =
      await this.prisma.camperPreRegistration.findFirst({
        where: {
          organizationId,
          status: { not: PreRegStatus.REVOKED },
          OR: [{ camperId: dto.camperId }, { username: dto.username }],
        },
      });

    if (existingActiveCamper) {
      const field =
        existingActiveCamper.camperId === dto.camperId
          ? '부스트캠프 ID'
          : 'GitHub ID';
      throw new ConflictException(`이미 해당 조직에 등록된 ${field}입니다.`);
    }

    // REVOKED 상태인 데이터가 있을 수 있으므로 upsert 사용
    const newCamper = await this.prisma.camperPreRegistration.upsert({
      where: {
        organizationId_camperId: {
          organizationId,
          camperId: dto.camperId,
        },
      },
      update: {
        ...dto,
        status: PreRegStatus.INVITED, // 다시 초대됨 상태로 변경
      },
      create: {
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
        groupNumber: true,
      },
    });

    // 해당 GitHub username을 가진 User가 이미 가입되어 있는지 확인
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    // 사용자가 가입되어 있다면 정보 업데이트 및 조직 연결
    let finalCamper = newCamper;
    if (user) {
      finalCamper = await this.prisma.$transaction(async (tx) => {
        // User 정보 업데이트 (name만)
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: dto.name,
          },
        });

        // CamperOrganization 생성/업데이트 (camperId, groupNumber 포함)
        await tx.camperOrganization.upsert({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId,
            },
          },
          update: {
            camperId: dto.camperId,
            groupNumber: dto.groupNumber,
          },
          create: {
            userId: user.id,
            organizationId,
            camperId: dto.camperId,
            groupNumber: dto.groupNumber,
          },
        });

        // PreRegistration 상태 업데이트 후 최신 데이터 반환
        return tx.camperPreRegistration.update({
          where: { id: newCamper.id },
          data: {
            status: PreRegStatus.CLAIMED,
            claimedUserId: user.id,
          },
          select: {
            id: true,
            camperId: true,
            name: true,
            username: true,
            track: true,
            status: true,
            groupNumber: true,
          },
        });
      });
    }

    return finalCamper;
  }

  async updateCamper(orgId: string, id: string, dto: UpdateCamperDto) {
    const existing = await this.prisma.camperPreRegistration.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== orgId) {
      throw new NotFoundException('캠퍼 정보를 찾을 수 없습니다.');
    }

    // 중복 체크 (본인 제외, REVOKED 제외)
    if (dto.camperId || dto.username) {
      const conflict = await this.prisma.camperPreRegistration.findFirst({
        where: {
          organizationId: orgId,
          id: { not: id },
          status: { not: PreRegStatus.REVOKED },
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
        groupNumber: true,
        claimedUserId: true,
      },
    });

    // CLAIMED 상태면 User와 CamperOrganization도 업데이트
    if (updated.status === PreRegStatus.CLAIMED && updated.claimedUserId) {
      const claimedUserId = updated.claimedUserId;

      await this.prisma.$transaction(async (tx) => {
        // User 업데이트 (name)
        if (dto.name) {
          await tx.user.update({
            where: { id: claimedUserId },
            data: { name: dto.name },
          });
        }

        // CamperOrganization 업데이트 (camperId, groupNumber)
        await tx.camperOrganization.update({
          where: {
            userId_organizationId: {
              userId: claimedUserId,
              organizationId: orgId,
            },
          },
          data: {
            ...(dto.camperId !== undefined && { camperId: dto.camperId }),
            ...(dto.groupNumber !== undefined && {
              groupNumber: dto.groupNumber,
            }),
          },
        });
      });
    }

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
      { header: '그룹 번호', key: 'groupNumber', width: 15 },
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
      groupNumber?: number;
    }[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 건너뛰기

      const camperId = row.getCell(1).text?.trim();
      const name = row.getCell(2).text?.trim();
      const username = row.getCell(3).text?.trim();
      const trackRaw = row.getCell(4).text?.trim()?.toUpperCase();
      const groupNumberStr = row.getCell(5).text?.trim();
      const groupNumber = groupNumberStr ? parseInt(groupNumberStr, 10) : undefined;

      if (!camperId || !name || !username || !trackRaw) return;

      const track = trackRaw as Track;
      if (!Object.values(Track).includes(track)) return;

      campersData.push({ camperId, name, username, track, groupNumber });
    });

    if (campersData.length === 0) {
      throw new BadRequestException('업로드할 캠퍼 정보가 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      const results: CamperPreRegistration[] = [];

      // 모든 관련 사용자 정보를 한 번에 조회하여 성능 최적화
      const usernames = campersData.map((d) => d.username);
      const existingUsers = await tx.user.findMany({
        where: { username: { in: usernames } },
        select: { id: true, username: true },
      });
      const userMap = new Map(existingUsers.map((u) => [u.username, u.id]));

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
            groupNumber: data.groupNumber,
            status: PreRegStatus.INVITED, // 업로드 시 재활성화
          },
          create: {
            ...data,
            organizationId,
            status: PreRegStatus.INVITED,
          },
        });

        const userId = userMap.get(data.username);

        // 사용자가 이미 가입되어 있다면 정보 업데이트 및 조직 연결
        if (userId) {
          // User 정보 업데이트 (name만)
          await tx.user.update({
            where: { id: userId },
            data: {
              name: data.name,
            },
          });

          // CamperOrganization 생성/업데이트
          await tx.camperOrganization.upsert({
            where: {
              userId_organizationId: {
                userId,
                organizationId,
              },
            },
            update: {
              camperId: data.camperId,
              groupNumber: data.groupNumber,
            },
            create: {
              userId,
              organizationId,
              camperId: data.camperId,
              groupNumber: data.groupNumber,
            },
          });

          // PreRegistration 상태 업데이트
          await tx.camperPreRegistration.update({
            where: { id: result.id },
            data: {
              status: PreRegStatus.CLAIMED,
              claimedUserId: userId,
            },
          });
        }

        results.push(result);
      }
      return results;
    });
  }
}
