import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryService } from './battery.service';
import { BatteryController } from './battery.controller';
import { Battery } from './entities/battery.entity';
import { BatteryTest } from './entities/battery-test.entity';
import { Test } from 'src/modules/test/entities/test.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Battery, Test, BatteryTest])],
  controllers: [BatteryController],
  providers: [BatteryService],
  exports: [BatteryService],
})
export class BatteryModule {}
