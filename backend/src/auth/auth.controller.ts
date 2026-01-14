import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { GithubAuthGuard } from './guards/github-auth.guard';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { Public } from 'src/common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.validateInternalUser(dto);

    const accessToken = this.auth.generateAccessToken({
      id: user.id,
      role: user.role,
    });

    this.setTokenCookie(res, accessToken);

    return { message: 'Login successful', role: user.role };
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  githubCallback(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = this.auth.generateAccessToken({
      id: user.id,
      role: user.role,
    });

    this.setTokenCookie(res, accessToken);

    const FRONTEND_URL = this.config.getOrThrow<string>('FRONTEND_URL');
    return res.redirect(FRONTEND_URL);
  }

  @Get('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', this.getCookieOptions());

    const FRONTEND_URL = this.config.getOrThrow<string>('FRONTEND_URL');
    return res.redirect(FRONTEND_URL);
  }

  private setTokenCookie(res: Response, accessToken: string) {
    const expiresIn = this.config.getOrThrow<StringValue>('JWT_EXPIRES_IN');
    const maxAge = ms(expiresIn);

    res.cookie('access_token', accessToken, {
      ...this.getCookieOptions(),
      maxAge,
    });
  }

  private getCookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
    };
  }
}
