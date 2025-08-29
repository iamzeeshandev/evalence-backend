import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestAssignment } from './entities/test-assignment.entity';
import { TestAssignmentsService } from './test-assignment.service';
import { TestAssignmentsController } from './test-assignment.controller';
import { UserTestAssignment } from './entities/user-test-assignments.entity';
@Module({
  imports: [TypeOrmModule.forFeature([TestAssignment, UserTestAssignment])],
  providers: [TestAssignmentsService],
  controllers: [TestAssignmentsController],
  exports: [TestAssignmentsService],
})
export class TestAssignmentsModule {}
