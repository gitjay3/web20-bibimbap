import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CustomThrottlerGuard } from 'src/common/guards/custom-throttler.guard';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { Public } from 'src/auth/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { JwtUser } from 'src/auth/types/jwt-user.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { ThrottleLogin } from './decorators/throttle-login.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('login')
  @UseGuards(CustomThrottlerGuard)
  @ThrottleLogin()
  @ApiOperation({
    summary: '내부 계정 로그인',
    description: '아이디/비밀번호로 로그인하고 쿠키에 토큰을 저장합니다.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: '로그인 성공',
  })
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

  @Public()
  @Get('github')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({
    summary: 'GitHub 로그인 시작',
    description: 'GitHub OAuth 인증 페이지로 리다이렉트합니다.',
  })
  @ApiResponse({
    status: 302,
    description: 'GitHub OAuth 리다이렉트',
  })
  githubLogin() {}

  @Public()
  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({
    summary: 'GitHub 로그인 콜백',
    description: 'GitHub OAuth 콜백 처리 후 프론트로 리다이렉트합니다.',
  })
  @ApiResponse({
    status: 302,
    description: '로그인 완료 후 프론트 리다이렉트',
  })
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
  @ApiOperation({
    summary: '로그아웃',
    description: '토큰 쿠키를 제거하고 프론트로 리다이렉트합니다.',
  })
  @ApiResponse({
    status: 302,
    description: '로그아웃 후 프론트 리다이렉트',
  })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', this.getCookieOptions());

    const FRONTEND_URL = this.config.getOrThrow<string>('FRONTEND_URL');
    return res.redirect(FRONTEND_URL);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '내 정보 조회',
    description: '현재 로그인한 사용자의 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '내 정보 조회 성공',
  })
  async getMe(@CurrentUser() user: JwtUser) {
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!fullUser) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    return fullUser;
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
