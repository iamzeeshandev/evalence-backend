import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from '../entities/test.entity';
import { Question } from 'src/modules/question/entities/question.entity';
import { Option } from 'src/modules/option/entities/option.entity';
import { QuestionOrientation, ScoringStandard } from 'src/enums/question.enum';

export interface PsychometricAnswer {
  questionId: string;
  optionId: string;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface PsychometricScoreResult {
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  dimensionScores: DimensionScore[];
}

@Injectable()
export class PsychometricScoringService {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Option)
    private optionRepository: Repository<Option>,
  ) {}

  /**
   * Calculate psychometric score based on answers
   */
  async calculatePsychometricScore(
    testId: string,
    answers: PsychometricAnswer[],
  ): Promise<PsychometricScoreResult> {
    // Get test with questions and options
    const test = await this.testRepository.findOne({
      where: { id: testId },
      relations: ['questions', 'questions.options'],
    });

    if (!test) {
      throw new BadRequestException('Test not found');
    }

    if (test.testCategory !== 'PSYCHOMETRIC') {
      throw new BadRequestException('This test is not a psychometric test');
    }

    // Validate all questions are answered
    const questionIds = test.questions.map((q) => q.id);
    const answeredQuestionIds = answers.map((a) => a.questionId);

    const unansweredQuestions = questionIds.filter(
      (id) => !answeredQuestionIds.includes(id),
    );

    if (unansweredQuestions.length > 0) {
      throw new BadRequestException(
        `Please answer all questions. Missing: ${unansweredQuestions.length} questions`,
      );
    }

    let totalScore = 0;
    let maxPossibleScore = 0;
    const dimensionScoresMap = new Map<
      string,
      { score: number; maxScore: number }
    >();

    // Process each answer
    for (const answer of answers) {
      const question = test.questions.find((q) => q.id === answer.questionId);
      if (!question) {
        throw new BadRequestException(
          `Question ${answer.questionId} not found`,
        );
      }

      const option = question.options.find((o) => o.id === answer.optionId);
      if (!option) {
        throw new BadRequestException(`Option ${answer.optionId} not found`);
      }

      // Calculate score based on orientation
      const questionScore = this.calculateQuestionScore(
        question,
        option,
        test.scoringStandard,
      );

      totalScore += questionScore;

      // Calculate max possible score for this question
      const maxQuestionScore = this.getMaxQuestionScore(
        test.scoringStandard,
        question.questionOrientation,
      );
      maxPossibleScore += maxQuestionScore;

      // Track dimension scores
      if (question.dimension) {
        const dimensionData = dimensionScoresMap.get(question.dimension) || {
          score: 0,
          maxScore: 0,
        };
        dimensionData.score += questionScore;
        dimensionData.maxScore += maxQuestionScore;
        dimensionScoresMap.set(question.dimension, dimensionData);
      }
    }

    // Calculate dimension scores with percentages
    const dimensionScores: DimensionScore[] = Array.from(
      dimensionScoresMap.entries(),
    ).map(([dimension, data]) => ({
      dimension,
      score: data.score,
      maxScore: data.maxScore,
      percentage: (data.score / data.maxScore) * 100,
    }));

    return {
      totalScore,
      maxPossibleScore,
      percentage: (totalScore / maxPossibleScore) * 100,
      dimensionScores,
    };
  }

  /**
   * Calculate score for a single question based on orientation
   */
  private calculateQuestionScore(
    question: Question,
    selectedOption: Option,
    scoringStandard: ScoringStandard,
  ): number {
    if (!selectedOption.scoringValue && selectedOption.scoringValue !== 0) {
      throw new BadRequestException(
        'Option does not have a scoring value configured',
      );
    }

    // For STRAIGHT questions, use the scoring value as is
    // For REVERSE questions, reverse the scoring
    if (question.questionOrientation === QuestionOrientation.REVERSE) {
      return this.reverseScore(selectedOption.scoringValue, scoringStandard);
    }

    return selectedOption.scoringValue;
  }

  /**
   * Reverse the score based on scoring standard
   */
  private reverseScore(
    score: number,
    scoringStandard: ScoringStandard,
  ): number {
    const { min, max } = this.getScoringRange(scoringStandard);
    return max + min - score;
  }

  /**
   * Get the scoring range based on scoring standard
   */
  private getScoringRange(scoringStandard: ScoringStandard): {
    min: number;
    max: number;
  } {
    switch (scoringStandard) {
      case ScoringStandard.ZERO_TO_FIVE:
        return { min: 0, max: 5 };
      case ScoringStandard.ONE_TO_FIVE:
        return { min: 1, max: 5 };
      case ScoringStandard.ZERO_TO_FOUR:
        return { min: 0, max: 4 };
      case ScoringStandard.ONE_TO_FOUR:
        return { min: 1, max: 4 };
      case ScoringStandard.ZERO_TO_TEN:
        return { min: 0, max: 10 };
      default:
        throw new BadRequestException('Invalid scoring standard');
    }
  }

  /**
   * Get maximum possible score for a question
   */
  private getMaxQuestionScore(
    scoringStandard: ScoringStandard,
    orientation: QuestionOrientation,
  ): number {
    const { max } = this.getScoringRange(scoringStandard);
    return max;
  }

  /**
   * Validate psychometric test structure
   */
  async validatePsychometricTest(test: Test): Promise<boolean> {
    if (test.testCategory !== 'PSYCHOMETRIC') {
      return true; // Not a psychometric test, no validation needed
    }

    if (!test.scoringStandard) {
      throw new BadRequestException(
        'Psychometric test must have a scoring standard',
      );
    }

    // Validate all questions have orientation
    const questionsWithoutOrientation = test.questions.filter(
      (q) => !q.questionOrientation,
    );

    if (questionsWithoutOrientation.length > 0) {
      throw new BadRequestException(
        'All questions in psychometric test must have orientation (STRAIGHT/REVERSE)',
      );
    }

    // Validate all options have scoring values
    for (const question of test.questions) {
      const optionsWithoutScore = question.options.filter(
        (o) => o.scoringValue === null || o.scoringValue === undefined,
      );

      if (optionsWithoutScore.length > 0) {
        throw new BadRequestException(
          `Question "${question.text}" has options without scoring values`,
        );
      }
    }

    return true;
  }
}
