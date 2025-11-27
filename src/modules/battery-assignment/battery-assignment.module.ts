import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryAssignmentController } from './battery-assignment.controller';
import { BatteryAssignmentService } from './battery-assignment.service';
import { BatteryGroupAssignment } from './entities/battery-group-assignment.entity';
import { Battery } from '../battery/entities/battery.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../user/entities/user.entity';
import { Test } from '../test/entities/test.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BatteryGroupAssignment,
      Battery,
      Group,
      User,
      Test,
    ]),
  ],
  controllers: [BatteryAssignmentController],
  providers: [BatteryAssignmentService],
  exports: [BatteryAssignmentService],
})
export class BatteryAssignmentModule {}
