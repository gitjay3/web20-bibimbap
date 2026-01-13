import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { User } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  githubCallback(@Req() req: AuthenticatedRequest) {
    return {
      message: 'GitHub 로그인 성공',
      user: req.user,
    };
  }
}
