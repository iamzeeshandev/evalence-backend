import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { Test } from './entities/test.entity';
import { Question } from '../question/entities/question.entity';
import { Option } from '../option/entities/option.entity';
import { PsychometricScoringService } from './services/psychometric-scoring.service';
import { BatteryAssignmentService } from '../battery-assignment/battery-assignment.service';
import { BatteryGroupAssignment } from '../battery-assignment/entities/battery-group-assignment.entity';
import { Battery } from '../battery/entities/battery.entity';
import { BatteryTest } from '../battery/entities/battery-test.entity';
import { User } from '../user/entities/user.entity';
import { GroupUser } from '../groups/entities/group-user.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupsModule } from '../groups/groups.module';
import { BatteryModule } from '../battery/battery.module';
import { BatteryAssignmentModule } from '../battery-assignment/battery-assignment.module'; // Import BatteryAssignmentModule

@Module({
  imports: [TypeOrmModule.forFeature([Test, Question, Option])],
  imports: [
    TypeOrmModule.forFeature([
      Test, 
      BatteryGroupAssignment, 
      Battery, 
      BatteryTest, 
      User, 
      GroupUser, 
      Group
    ]),
    GroupsModule,
    BatteryModule,
    BatteryAssignmentModule // Add BatteryAssignmentModule
  ],
  controllers: [TestController],
  providers: [TestService, PsychometricScoringService],
  exports: [TestService, PsychometricScoringService],
  providers: [TestService, BatteryAssignmentService],
  exports: [TestService],
})
export class TestModule {}