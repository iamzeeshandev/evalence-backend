import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TestAttempt } from './entities/test-attempt.entity';
import { ListAttemptsDto, StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { TestService } from 'src/modules/test/test.service';
import { AttemptStatus } from 'src/enums/attempt.enum';
import { AttemptAnswer } from '../attempt-answer/entities/attempt-answer.entity';

@Injectable()
export class TestAttemptService {
  constructor(
    @InjectRepository(TestAttempt)
    private readonly repo: Repository<TestAttempt>,
    private readonly testRead: TestService,
    private readonly dataSource: DataSource,
  ) {}

  private isTimedOut(startedAt: Date, durationMinutes: number): boolean {
    const deadline = new Date(
      startedAt.getTime() + durationMinutes * 60 * 1000,
    );
    return new Date() > deadline;
  }

  // Allow AttemptAnswersService to verify attempt is writable
  async getWritableAttempt(userId: string, attemptId: string) {
    const attempt = await this.repo.findOne({
      where: { id: attemptId, userId },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt not in progress');
    }
    return attempt;
  }

  async incrementTime(attemptId: string, incSec: number) {
    await this.repo.increment({ id: attemptId }, 'timeSpentSec', incSec);
  }

  async start(dto: StartAttemptDto) {
    const { userId, testId } = dto;

    // Resume if an in-progress attempt exists and not timed out
    // const existing = await this.repo.findOne({
    //   where: { userId, testId, status: AttemptStatus.IN_PROGRESS },
    // });
    // if (existing) {
    //   if (
    //     existing.startedAt &&
    //     this.isTimedOut(existing.startedAt, test.duration)
    //   ) {
    //     existing.status = AttemptStatus.EXPIRED;
    //     existing.isTimedOut = true;
    //     await this.repo.save(existing);
    //   } else {
    //     return existing;
    //   }
    // }

    const attempt = this.repo.create({
      testId,
      userId,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
      questionCount: 2,
    });
    return this.repo.save(attempt);
  }

  async submit(dto: SubmitAttemptDto) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(TestAttempt);
      const answersRepo = manager.getRepository(AttemptAnswer);

      const attempt = await repo.findOne({
        where: { id: dto.attemptId },
      });
      if (!attempt) throw new NotFoundException('Attempt not found');
      if (attempt.status !== AttemptStatus.IN_PROGRESS)
        throw new BadRequestException('Attempt not in progress');

      const test = await this.testRead.getActiveTestWithQuestions(
        attempt.testId,
      );

      // Timebox
      const timedOut = attempt.startedAt
        ? this.isTimedOut(attempt.startedAt, test.duration)
        : false;
      if (
        dto.finalTimeSpentSec &&
        dto.finalTimeSpentSec > attempt.timeSpentSec
      ) {
        attempt.timeSpentSec = dto.finalTimeSpentSec;
      }

      // Score
      const answers = await answersRepo.find({
        where: { attemptId: attempt.id },
      });
      const qMap = new Map(test.questions.map((q) => [q.id, q]));
      const correctSets = new Map(
        test.questions.map((q) => [
          q.id,
          new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id)),
        ]),
      );

      let totalPoints = 0,
        awardedPoints = 0,
        correctCount = 0;
      for (const q of test.questions) totalPoints += q.points;

      for (const a of answers) {
        const q = qMap.get(a.questionId);
        if (!q) continue;

        const correctSet = correctSets.get(q.id) ?? new Set<string>();
        const selected = new Set(a.selectedOptionIds ?? []);
        const isCorrect =
          selected.size === correctSet.size &&
          [...selected].every((id) => correctSet.has(id));

        a.isCorrect = isCorrect;

        const intersection = [...selected].filter((id) =>
          correctSet.has(id),
        ).length;
        const overSelected = [...selected].filter(
          (id) => !correctSet.has(id),
        ).length;
        const denom = Math.max(correctSet.size, 1);
        const base = (intersection / denom) * q.points;
        const penalty =
          overSelected > 0
            ? Math.min(overSelected, q.points) * (q.points / denom) * 0.5
            : 0;
        a.pointsAwarded = Math.max(0, Math.round(base - penalty));

        awardedPoints += a.pointsAwarded;
        if (isCorrect) correctCount += 1;
      }

      await answersRepo.save(answers);

      attempt.totalPoints = totalPoints;
      attempt.awardedPoints = awardedPoints;
      attempt.correctCount = correctCount;
      attempt.percentage = totalPoints
        ? Number(((awardedPoints / totalPoints) * 100).toFixed(2))
        : 0;
      attempt.status = timedOut
        ? AttemptStatus.EXPIRED
        : AttemptStatus.SUBMITTED;
      attempt.isTimedOut = timedOut;
      attempt.submittedAt = new Date();

      return repo.save(attempt);
    });
  }

  async list(userId: string, q: ListAttemptsDto) {
    return this.repo.find({
      where: { userId, ...(q.testId ? { testId: q.testId } : {}) },
      order: { createdAt: 'DESC' },
    });
  }

  async userAttempts(userId: string) {
    return this.repo.find({
      where: {
        user: {
          id: userId,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }
  async get(id: string) {
    const attempt = await this.repo.findOne({
      where: { id },
      relations: ['test', 'attemptAnswers'],
    });
    console.log('Retrieved attempt:', id, attempt);
    if (!attempt) throw new NotFoundException();
    return attempt;
  }
}
