import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { UsersModule } from '../user/user.module';
import { CompaniesModule } from '../company/company.module';
import { OPTIONS } from 'src/utils/jwt-options';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [UsersModule, CompaniesModule, JwtModule.register(OPTIONS)],
  exports: [AuthService],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
