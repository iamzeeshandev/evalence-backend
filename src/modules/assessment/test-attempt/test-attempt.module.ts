import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestAttempt } from './entities/test-attempt.entity';
import { TestModule } from 'src/modules/test/test.module';
import { TestAssignmentsModule } from '../test-assignment/test-assignment.module';
import { TestAttemptController } from './test-attempt.controller';
import { TestAttemptService } from './test-attempt.service';
import { UserTestAssignment } from '../test-assignment/entities/user-test-assignments.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestAttempt]),
    TestModule,
    TestAssignmentsModule,
    UserTestAssignment,
  ],
  providers: [TestAttemptService],
  controllers: [TestAttemptController],
  exports: [TestAttemptService],
})
export class TestAttemptModule {}
