import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupController } from './groups.controller';
import { GroupService } from './groups.service';
import { Group } from './entities/group.entity';
import { GroupUser } from './entities/group-user.entity';
import { User } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupUser, User, Company])],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupsModule {}
