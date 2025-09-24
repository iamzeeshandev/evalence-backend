import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../interfaces/auth.interface';

interface JwtRefreshPayload {
  sub: string;
  email: string;
  role: string;
  companyId: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  public constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtRefreshPayload): Promise<AuthenticatedUser> {
    console.log(
      'JWT Refresh Strategy validating payload at:',
      new Date().toISOString(),
    );
    console.log('Refresh Payload:', payload);

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
    };
  }
}
