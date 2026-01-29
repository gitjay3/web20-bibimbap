import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminInviteStatus, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // 초대 생성
  async createInvitation(githubUsername: string, inviterId: string) {
    const existingAdmin = await this.prisma.user.findFirst({
      where: {
        username: { equals: githubUsername, mode: 'insensitive' },
        role: Role.ADMIN,
      },
    });

    if (existingAdmin) {
      throw new ConflictException('이미 운영진입니다.');
    }

    const existingInvitation = await this.prisma.adminInvitation.findFirst({
      where: {
        githubUsername: { equals: githubUsername, mode: 'insensitive' },
        status: AdminInviteStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException('이미 초대가 발송되었습니다.');
    }

    return this.prisma.adminInvitation.create({
      data: {
        githubUsername: githubUsername.toLowerCase(),
        invitedById: inviterId,
      },
    });
  }

  // 초대 목록 조회
  async getInvitations() {
    return this.prisma.adminInvitation.findMany({
      where: {
        status: AdminInviteStatus.PENDING,
      },
      include: {
        inviter: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        invitedAt: 'desc',
      },
    });
  }

  // 초대 취소
  async revokeInvitation(invitationId: string) {
    const invitation = await this.prisma.adminInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('초대를 찾을 수 없습니다.');
    }

    if (invitation.status !== AdminInviteStatus.PENDING) {
      throw new BadRequestException('대기 중인 초대만 취소할 수 있습니다.');
    }

    return this.prisma.adminInvitation.update({
      where: { id: invitationId },
      data: { status: AdminInviteStatus.REVOKED },
    });
  }

  // 운영진 목록 조회
  async getAdminMembers() {
    return this.prisma.user.findMany({
      where: {
        role: Role.ADMIN,
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // 운영진 권한 해제
  async removeAdmin(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new BadRequestException('자신의 권한은 해제할 수 없습니다.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (targetUser.role !== Role.ADMIN) {
      throw new BadRequestException('해당 사용자는 운영진이 아닙니다.');
    }

    const adminCount = await this.prisma.user.count({
      where: { role: Role.ADMIN },
    });

    if (adminCount <= 1) {
      throw new BadRequestException('최소 1명의 운영진이 필요합니다.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.USER },
    });
  }

  // GitHub 로그인 시 초대 확인 및 처리
  async processInvitationOnLogin(githubUsername: string, userId: string) {
    const invitation = await this.prisma.adminInvitation.findFirst({
      where: {
        githubUsername: { equals: githubUsername, mode: 'insensitive' },
        status: AdminInviteStatus.PENDING,
      },
    });

    if (!invitation) {
      return null; // 초대 없음
    }

    // 트랜잭션으로 처리
    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.ADMIN },
      }),
      this.prisma.adminInvitation.update({
        where: { id: invitation.id },
        data: {
          status: AdminInviteStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedUserId: userId,
        },
      }),
    ]);

    return updatedUser;
  }
}
