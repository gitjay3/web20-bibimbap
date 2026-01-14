import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {}

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  githubCallback(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;

    const accessToken = this.auth.generateAccessToken({
      id: user.id,
      role: user.role,
    });

    const expiresIn = this.config.getOrThrow<StringValue>('JWT_EXPIRES_IN');
    const maxAge = ms(expiresIn);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge,
    });

    const FRONTEND_URL = this.config.getOrThrow<string>('FRONTEND_URL');
    return res.redirect(FRONTEND_URL);
  }

  @Get('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
    });

    const FRONTEND_URL = this.config.getOrThrow<string>('FRONTEND_URL');
    return res.redirect(FRONTEND_URL);
  }
}
