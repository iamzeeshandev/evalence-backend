import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestAttempt } from './entities/test-attempt.entity';
import { TestModule } from 'src/modules/test/test.module';
import { TestAttemptController } from './test-attempt.controller';
import { TestAttemptService } from './test-attempt.service';
import { BatteryAssignmentModule } from '../../battery-assignment/battery-assignment.module';
import { BatteryProgressModule } from '../../battery-progress/battery-progress.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestAttempt]),
    TestModule,
    BatteryAssignmentModule,
    BatteryProgressModule,
  ],
  providers: [TestAttemptService],
  controllers: [TestAttemptController],
  exports: [TestAttemptService],
})
export class TestAttemptModule {}
