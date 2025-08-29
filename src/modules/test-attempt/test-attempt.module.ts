import { Module } from '@nestjs/common';
import { TestAttemptService } from './test-attempt.service';
import { TestAttemptController } from './test-attempt.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from '../test/entities/test.entity';
import { Question } from '../question/entities/question.entity';
import { User } from '../user/entities/user.entity';
import { TestAttempt } from './entities/test-attempt.entity';
import { UserAnswer } from './entities/user-answer.entity';
import { Option } from '../option/entities/option.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TestAttempt,
      UserAnswer,
      User,
      Test,
      Question,
      Option,
    ]),
  ],
  controllers: [TestAttemptController],
  providers: [TestAttemptService],
  exports: [TestAttemptService],
})
export class TestAttemptModule {}
