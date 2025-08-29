import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { Test } from './entities/test.entity';
import { TestAssignmentsModule } from '../assessment/test-assignment/test-assignment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Test]), TestAssignmentsModule],
  controllers: [TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule {}
