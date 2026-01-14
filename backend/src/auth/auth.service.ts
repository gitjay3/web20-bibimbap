import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

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
