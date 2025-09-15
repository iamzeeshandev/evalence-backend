import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

const JWT_SECRET =
  process.env.JWT_TOKEN_SECRET || 'default-secret-key-change-in-production';
const JWT_EXPIRY = process.env.ACCESS_TOKEN_EXPIRATION || '1h';
const JWT_REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRATION || '7d';

const BASE_OPTIONS: JwtSignOptions = {
  issuer: 'https://evalence.com',
  audience: 'https://evalence.com',
};

export interface RefreshTokenPayload {
  jti: string;
  sub: string;
}

const OPTIONS: JwtModuleOptions = {
  global: true,
  secret: JWT_SECRET,
  signOptions: {
    expiresIn: JWT_EXPIRY,
  },
};

export { BASE_OPTIONS, OPTIONS, JWT_SECRET, JWT_EXPIRY, JWT_REFRESH_EXPIRY };
