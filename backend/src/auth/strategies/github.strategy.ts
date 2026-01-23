import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

interface GithubProfileJson {
  avatar_url?: string;
}

interface GithubProfile extends Profile {
  _json?: GithubProfileJson;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GITHUB_CALLBACK_URL'),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GithubProfile,
  ) {
    const { id, username, displayName, photos } = profile;

    const user = await this.auth.findOrCreateGithubUser({
      githubId: id,
      githubLogin: username ?? id,
      name: displayName ?? username,
      avatarUrl: photos?.[0]?.value || profile._json?.avatar_url,
    });

    return user;
  }
}
