declare module '@nestjs/passport' {
  export class AuthGuard {
    constructor(strategy: string);
    canActivate(context: any): Promise<boolean>;
  }
  export class PassportStrategy {
    constructor(strategy: any);
  }
}
