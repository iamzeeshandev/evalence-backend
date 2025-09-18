import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '10s';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Debug logging - this will show us what's happening
console.log('=== JWT Configuration Debug ===');
console.log('All env vars with JWT:', Object.keys(process.env).filter(key => key.includes('JWT')));
console.log('JWT_SECRET from env:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_EXPIRY from env:', process.env.JWT_EXPIRY);
console.log('JWT_EXPIRY final value:', JWT_EXPIRY);
console.log('JWT_REFRESH_EXPIRY from env:', process.env.JWT_REFRESH_EXPIRY);
console.log('Current working directory:', process.cwd());
console.log('================================');

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

// Export a function to get JWT options with ConfigService
export const getJwtOptions = (configService: ConfigService): JwtModuleOptions => {
  const secret = configService.get<string>('JWT_SECRET') || JWT_SECRET;
  const expiresIn = configService.get<string>('JWT_EXPIRY') || JWT_EXPIRY;
  
  console.log('getJwtOptions called with:', { secret: secret ? 'SET' : 'NOT SET', expiresIn });
  
  return {
    global: true,
    secret,
    signOptions: {
      expiresIn,
    },
  };
};

export { BASE_OPTIONS, OPTIONS, JWT_SECRET, JWT_EXPIRY, JWT_REFRESH_EXPIRY };
