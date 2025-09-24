import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CompaniesModule } from '../company/company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => CompaniesModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
