import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttemptAnswer } from './entities/attempt-answer.entity';
import { AttemptAnswerService } from './attempt-answer.service';
import { AttemptAnswerController } from './attempt-answer.controller';
import { TestModule } from 'src/modules/test/test.module';
import { TestAttemptModule } from '../test-attempt/test-attempt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttemptAnswer]),
    TestModule,
    TestAttemptModule,
  ],
  providers: [AttemptAnswerService],
  controllers: [AttemptAnswerController],
  exports: [AttemptAnswerService],
})
export class AttemptAnswerModule {}
