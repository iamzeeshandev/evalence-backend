import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const BASE_OPTIONS: JwtSignOptions = {
  issuer: 'https://evalence.com',
  audience: 'https://evalence.com',
};

export interface RefreshTokenPayload {
  jti: string;
  sub: string;
}

export const getJwtOptions = (
  configService: ConfigService,
): JwtModuleOptions => {
  const secret = configService.get<string>('JWT_SECRET');
  const expiresIn = configService.get<string>('JWT_EXPIRY');

  return {
    global: true,
    secret,
    signOptions: {
      expiresIn,
    },
  };
};

export const getRefreshTokenExpiry = (configService: ConfigService) => {
  return configService.get<string>('JWT_REFRESH_EXPIRY');
};

export { BASE_OPTIONS };
