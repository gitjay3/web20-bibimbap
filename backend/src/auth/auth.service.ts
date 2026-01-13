import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
