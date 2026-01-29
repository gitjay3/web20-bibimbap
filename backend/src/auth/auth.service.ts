import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, Role, PreRegStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcrypt';
import { AdminInviteStatus, Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  generateAccessToken(user: { id: string; role: string }) {
    const payload = {
      sub: user.id,
      role: user.role,
    };

    return this.jwt.sign(payload);
  }

  async validateInternalUser(loginDto: LoginDto) {
    const { id, password } = loginDto;

    const authAccount = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'INTERNAL',
          providerId: id,
        },
      },
      include: { user: true },
    });

    if (!authAccount || !authAccount.passwordHash) {
      throw new UnauthorizedException('존재하지 않는 계정입니다.');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      authAccount.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    return authAccount.user;
  }

  async findOrCreateGithubUser(data: {
    githubId: string;
    githubLogin: string;
    name: string;
    avatarUrl?: string;
  }) {
    const authAccount = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerId: {
          provider: AuthProvider.GITHUB,
          providerId: data.githubId,
        },
      },
      include: {
        user: true,
      },
    });

    // 1. GitHub AuthAccount가 이미 존재하는 경우 반환
    if (authAccount) {
      await this.processAdminInvitation(data.githubLogin, authAccount.user.id);

      // 업데이트된 사용자 정보 반환 (role이 변경됐을 수 있음)
      return this.prisma.user.findUnique({
        where: { id: authAccount.user.id },
      });
    }

    // 2. AuthAccount가 없는 경우
    // 2-1. 같은 username의 User가 이미 존재하는지 확인 (seed로 생성된 GitHub admin 등)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        username: { equals: data.githubLogin, mode: 'insensitive' },
      },
    });

    if (existingUser) {
      // 기존 User에 GitHub AuthAccount 연결
      await this.prisma.authAccount.create({
        data: {
          provider: AuthProvider.GITHUB,
          providerId: data.githubId,
          userId: existingUser.id,
        },
      });

      // 프로필 이미지 업데이트 (없는 경우에만)
      if (!existingUser.avatarUrl && data.avatarUrl) {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { avatarUrl: data.avatarUrl },
        });
      }

      await this.processAdminInvitation(data.githubLogin, existingUser.id);

      return this.prisma.user.findUnique({
        where: { id: existingUser.id },
      });
    }

    // 2-2. 사전 등록(PreRegistration) 확인
    // GitHub Username을 기준으로 INVITED 상태인 초대장을 찾는다.
    // 대소문자 무시 비교 (GitHub username은 대소문자 구분 없음)
    const preRegistrations = await this.prisma.camperPreRegistration.findMany({
      where: {
        username: { equals: data.githubLogin, mode: 'insensitive' },
        status: PreRegStatus.INVITED,
      },
    });

    // 트랜잭션으로 유저 생성 + 조직 연결 + 초대장 상태 변경 처리
    return this.prisma.$transaction(async (tx) => {
      // (1) User & AuthAccount 생성
      const newUser = await tx.user.create({
        data: {
          username: data.githubLogin, // GitHub username 저장
          name: preRegistrations[0]?.name || null, // 사전 등록된 실명 (없으면 null)
          avatarUrl: data.avatarUrl || null, // 프로필 이미지 URL
          role: Role.USER,
          authAccounts: {
            create: {
              provider: AuthProvider.GITHUB,
              providerId: data.githubId,
            },
          },
        },
      });

      // (2) 사전 등록된 정보가 있다면 연결
      if (preRegistrations.length > 0) {
        // A. CamperOrganization 생성 (User - Organization N:M 연결)
        await tx.camperOrganization.createMany({
          data: preRegistrations.map((preReg) => ({
            userId: newUser.id,
            organizationId: preReg.organizationId,
            camperId: preReg.camperId, // camperId를 CamperOrganization에 저장
            groupNumber: preReg.groupNumber, // groupNumber 연동
          })),
        });

        // B. PreRegistration 상태 업데이트 (INVITED -> CLAIMED)
        await tx.camperPreRegistration.updateMany({
          where: {
            id: { in: preRegistrations.map((p) => p.id) },
          },
          data: {
            status: PreRegStatus.CLAIMED,
            claimedUserId: newUser.id,
          },
        });
      }

      await this.processAdminInvitationInTx(tx, data.githubLogin, newUser.id);

      return newUser;
    });
  }

  private async processAdminInvitation(githubUsername: string, userId: string) {
    const invitation = await this.prisma.adminInvitation.findFirst({
      where: {
        githubUsername: { equals: githubUsername, mode: 'insensitive' },
        status: AdminInviteStatus.PENDING,
      },
    });

    if (!invitation) return;

    await this.prisma.$transaction([
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
  }

  private async processAdminInvitationInTx(
    tx: Prisma.TransactionClient,
    githubUsername: string,
    userId: string,
  ) {
    const invitation = await tx.adminInvitation.findFirst({
      where: {
        githubUsername: { equals: githubUsername, mode: 'insensitive' },
        status: AdminInviteStatus.PENDING,
      },
    });

    if (!invitation) return;

    await tx.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN },
    });

    await tx.adminInvitation.update({
      where: { id: invitation.id },
      data: {
        status: AdminInviteStatus.ACCEPTED,
        acceptedAt: new Date(),
        acceptedUserId: userId,
      },
    });
  }
}
