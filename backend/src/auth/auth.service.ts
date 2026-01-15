import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, Role } from '@prisma/client';
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

    if (authAccount) {
      return authAccount.user;
    }

    return this.prisma.user.create({
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
  }
}
