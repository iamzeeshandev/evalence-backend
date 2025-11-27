import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTestAttemptDto,
  SubmitAnswerDto,
  SubmitTestDto,
} from './dto/create-test-attempt.dto';
// import { UpdateTestAttemptDto } from "./dto/update-test-attempt.dto";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../question/entities/question.entity';
import { User } from '../user/entities/user.entity';
import { TestAttempt } from './entities/test-attempt.entity';
import { UserAnswer } from './entities/user-answer.entity';
import { Test } from '../test/entities/test.entity';
import { Option } from '../option/entities/option.entity';
import { PsychometricScoringService } from '../test/services/psychometric-scoring.service';
import {
  SubmitPsychometricTestDto,
  PsychometricScoreResponseDto,
} from './dto/submit-psychometric-test.dto';

@Injectable()
export class TestAttemptService {
  constructor(
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepository: Repository<TestAttempt>,
    @InjectRepository(UserAnswer)
    private readonly answerRepository: Repository<UserAnswer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Option)
    private readonly optionRepository: Repository<Option>,
    private readonly psychometricScoringService: PsychometricScoringService,
  ) {}
  async startAttempt(dto: CreateTestAttemptDto): Promise<TestAttempt> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    const test = await this.testRepository.findOne({
      where: { id: dto.testId },
      relations: ['questions'],
    });

    if (!user || !test) throw new NotFoundException('User or Test not found');

    const attempt = this.testAttemptRepository.create({
      user,
      test,
      startedAt: new Date(),
      totalPoints: test.questions.reduce((sum, q) => sum + q.points, 0),
    });

    return this.testAttemptRepository.save(attempt);
  }

  async submitAnswer(attemptId: string, dto: SubmitAnswerDto) {
    const attempt = await this.testAttemptRepository.findOne({
      where: { id: attemptId },
      relations: ['test'],
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.isCompleted) {
      throw new BadRequestException('Attempt already finished');
    }

    const question = await this.questionRepository.findOne({
      where: { id: dto.questionId },
      relations: ['options'],
    });

    if (!question) throw new NotFoundException('Question not found');

    const option = await this.optionRepository.findOne({
      where: { id: dto.optionId },
    });
    if (!option) throw new NotFoundException('Option not found');

    const isCorrect = option.isCorrect;

    //save answer
    const answer = this.answerRepository.create({
      attempt,
      question,
      selectedOption: option,
      isCorrect,
    });
    await this.answerRepository.save(answer);

    // update score
    if (isCorrect) {
      attempt.score += question.points;
      await this.testAttemptRepository.save(attempt);
    }

    return answer;
  }

  async finishAttempt(attemptId: string): Promise<TestAttempt> {
    const attempt = await this.testAttemptRepository.findOne({
      where: { id: attemptId },
      relations: ['answers'],
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    attempt.isCompleted = true;
    attempt.completedAt = new Date();

    return this.testAttemptRepository.save(attempt);
  }

  async submitTest(dto: SubmitTestDto): Promise<TestAttempt> {
    const attempt = await this.testAttemptRepository.findOne({
      where: { id: dto.attemptId },
      relations: ['test', 'test.questions', 'test.questions.options'],
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.isCompleted)
      throw new BadRequestException('Attempt already completed');

    let score = 0;

    // Remove old answers if exist (safety)
    await this.answerRepository.delete({ attempt: { id: attempt.id } });

    for (const submitted of dto.answers) {
      const question = attempt.test.questions.find(
        (q) => q.id === submitted.questionId,
      );
      if (!question)
        throw new BadRequestException(
          `Invalid question ${submitted.questionId}`,
        );

      const option = question.options.find((o) => o.id === submitted.optionId);
      if (!option)
        throw new BadRequestException(
          `Invalid option for question ${submitted.questionId}`,
        );

      const isCorrect = option.isCorrect;

      if (isCorrect) {
        score += question.points;
      }

      const answer = this.answerRepository.create({
        attempt,
        question,
        selectedOption: option,
        isCorrect,
      });
      await this.answerRepository.save(answer);
    }

    attempt.score = score;
    attempt.isCompleted = true;
    attempt.completedAt = new Date();

    return this.testAttemptRepository.save(attempt);
  }

  async getResult(attemptId: string): Promise<TestAttempt | null> {
    return await this.testAttemptRepository.findOne({
      where: { id: attemptId },
      relations: [
        'answers',
        'answers.question',
        'answers.selectedOption',
        'test',
      ],
    });
  }

  async getUserAttempts(userId: string): Promise<TestAttempt[]> {
    return this.testAttemptRepository.find({
      where: { user: { id: userId } },
      relations: ['test'],
      order: { createdAt: 'DESC' },
    });
  }
  // create(createTestAttemptDto: CreateTestAttemptDto) {
  //   return "This action adds a new testAttempt";
  // }

  // findAll() {
  //   return `This action returns all testAttempt`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} testAttempt`;
  // }

  // update(id: number, updateTestAttemptDto: UpdateTestAttemptDto) {
  //   return `This action updates a #${id} testAttempt`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} testAttempt`;
  // }

  /**
   * Submit psychometric test and calculate scores
   */
  async submitPsychometricTest(
    dto: SubmitPsychometricTestDto,
  ): Promise<PsychometricScoreResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify test exists and is psychometric
    const test = await this.testRepository.findOne({
      where: { id: dto.testId },
      relations: ['questions', 'questions.options'],
    });
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    if (test.testCategory !== 'PSYCHOMETRIC') {
      throw new BadRequestException('This is not a psychometric test');
    }

    // Calculate psychometric score
    const scoreResult =
      await this.psychometricScoringService.calculatePsychometricScore(
        dto.testId,
        dto.answers,
      );

    // Create test attempt record
    const testAttempt = this.testAttemptRepository.create({
      user,
      test,
      score: scoreResult.totalScore,
      totalPoints: scoreResult.maxPossibleScore,
      isCompleted: true,
      startedAt: new Date(),
      completedAt: new Date(),
    });
    const savedAttempt = await this.testAttemptRepository.save(testAttempt);

    // Save user answers
    const userAnswers = dto.answers.map((answer) => {
      const question = test.questions.find((q) => q.id === answer.questionId);
      const option = question?.options.find((o) => o.id === answer.optionId);

      return this.answerRepository.create({
        attempt: savedAttempt,
        question,
        selectedOption: option,
        isCorrect: false, // Not applicable for psychometric tests
      });
    });
    await this.answerRepository.save(userAnswers);

    return {
      attemptId: savedAttempt.id,
      totalScore: scoreResult.totalScore,
      maxPossibleScore: scoreResult.maxPossibleScore,
      percentage: scoreResult.percentage,
      dimensionScores: scoreResult.dimensionScores,
      completedAt: savedAttempt.completedAt,
    };
  }
}
