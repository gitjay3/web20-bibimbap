import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, Role, PreRegStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcrypt';

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

    // 1. 가입된 경우
    if (authAccount) {
      return authAccount.user;
    }

    // 2. 가입되지 않은 경우 User 생성
    // 2-1. 사전 등록(PreRegistration) 확인
    // GitHub Username을 기준으로 INVITED 상태인 초대장을 찾는다.
    const preRegistrations = await this.prisma.camperPreRegistration.findMany({
      where: {
        username: data.githubLogin,
        status: PreRegStatus.INVITED,
      },
    });

    // 트랜잭션으로 유저 생성 + 조직 연결 + 초대장 상태 변경 처리
    return this.prisma.$transaction(async (tx) => {
      // (1) User & AuthAccount 생성
      const newUser = await tx.user.create({
        data: {
          name: data.name,
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

      return newUser;
    });
  }
}
