import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttemptAnswer } from './entities/attempt-answer.entity';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { TestAttemptService } from '../test-attempt/test-attempt.service';
import { TestService } from 'src/modules/test/test.service';

@Injectable()
export class AttemptAnswerService {
  constructor(
    @InjectRepository(AttemptAnswer)
    private readonly repo: Repository<AttemptAnswer>,
    private readonly testService: TestService,
    private readonly attemptService: TestAttemptService,
  ) {}

  async upsertAnswer(dto: SaveAnswerDto) {
    const { attemptId, questionId, userId } = dto;
    console.log('Upserting answer:', { userId, attemptId, questionId });
    const attempt = await this.attemptService.getWritableAttempt(
      userId,
      dto.attemptId,
    );

    // Validate question belongs to the test
    const test = await this.testService.getActiveTestWithQuestions(
      attempt.testId,
    );
    const q = test.questions.find((q) => q.id === dto.questionId);
    if (!q) throw new BadRequestException('Question not part of the test');

    // Validate options belong to the question
    const allOptionIds = new Set(q.options.map((o) => o.id));
    const everyValid = dto.selectedOptionIds.every((id) =>
      allOptionIds.has(id),
    );
    if (!everyValid)
      throw new BadRequestException('Invalid option for question');

    let answer = await this.repo.findOne({
      where: { testAttemptId: attempt.id, questionId: q.id },
    });
    if (!answer) {
      answer = this.repo.create({
        testAttemptId: attempt.id,
        questionId: q.id,
        selectedOptionIds: dto.selectedOptionIds,
      });
    } else {
      answer.selectedOptionIds = dto.selectedOptionIds;
    }

    // Bump time on attempt if provided (delegated)
    if (dto.timeSpentIncrementSec && dto.timeSpentIncrementSec > 0) {
      await this.attemptService.incrementTime(
        attempt.id,
        dto.timeSpentIncrementSec,
      );
    }

    return this.repo.save(answer);
  }

  async listByAttempt(attemptId: string) {
    return this.repo.find({
      where: { testAttemptId: attemptId },
      order: { createdAt: 'ASC' },
    });
  }
}
