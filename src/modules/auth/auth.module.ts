import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { UsersModule } from '../user/user.module';
import { CompaniesModule } from '../company/company.module';
import { OPTIONS, getJwtOptions } from 'src/utils/jwt-options';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule, 
    CompaniesModule, 
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => getJwtOptions(configService),
      inject: [ConfigService],
    })
  ],
  exports: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
