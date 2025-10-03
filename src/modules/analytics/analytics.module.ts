import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { BatteryAssignmentModule } from '../battery-assignment/battery-assignment.module';
import { BatteryProgressModule } from '../battery-progress/battery-progress.module';

@Module({
  imports: [BatteryAssignmentModule, BatteryProgressModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}

