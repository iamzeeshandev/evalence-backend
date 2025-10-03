import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryProgressController } from './battery-progress.controller';
import { BatteryProgressService } from './battery-progress.service';
import { BatteryProgress } from './entities/battery-progress.entity';
import { Battery } from '../battery/entities/battery.entity';
import { User } from '../user/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { TestAttempt } from '../assessment/test-attempt/entities/test-attempt.entity';
import { BatteryTest } from '../battery/entities/battery-test.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BatteryProgress,
      Battery,
      User,
      Group,
      TestAttempt,
      BatteryTest,
    ]),
  ],
  controllers: [BatteryProgressController],
  providers: [BatteryProgressService],
  exports: [BatteryProgressService],
})
export class BatteryProgressModule {}
