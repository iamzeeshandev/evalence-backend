import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { Test } from './entities/test.entity';
import { Question } from '../question/entities/question.entity';
import { Option } from '../option/entities/option.entity';
import { PsychometricScoringService } from './services/psychometric-scoring.service';

@Module({
  imports: [TypeOrmModule.forFeature([Test, Question, Option])],
  controllers: [TestController],
  providers: [TestService, PsychometricScoringService],
  exports: [TestService, PsychometricScoringService],
})
export class TestModule {}
