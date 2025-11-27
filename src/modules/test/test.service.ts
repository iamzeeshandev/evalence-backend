import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from '../test/entities/test.entity';
import { CreateTestDto } from '../test/dto/create-test-dto';
import { UpdateTestDto } from '../test/dto/update-test-dto';
import { PsychometricScoringService } from './services/psychometric-scoring.service';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
    private psychometricScoringService: PsychometricScoringService,
  ) {}

  async findAll(): Promise<Test[]> {
    return await this.testRepository.find({
      relations: ['questions', 'questions.options'],
      order: {
        questions: {
          questionNo: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'batteryTests'],
    });

    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }

    return test;
  }

  async create(createTestDto: CreateTestDto): Promise<Test> {
    const { questions } = createTestDto;
    console.log('Creating test with questions:', { questions });
    const test = this.testRepository.create(createTestDto);
    const savedTest = await this.testRepository.save(test);

    // Validate psychometric test structure if applicable
    if (savedTest.testCategory === 'PSYCHOMETRIC') {
      const testWithRelations = await this.findOne(savedTest.id);
      await this.psychometricScoringService.validatePsychometricTest(
        testWithRelations,
      );
    }

    return savedTest;
  }

  async update(id: string, updateTestDto: UpdateTestDto): Promise<Test> {
    const test = await this.findOne(id);
    Object.assign(test, updateTestDto);
    const updatedTest = await this.testRepository.save(test);

    // Validate psychometric test structure if applicable
    if (updatedTest.testCategory === 'PSYCHOMETRIC') {
      const testWithRelations = await this.findOne(updatedTest.id);
      await this.psychometricScoringService.validatePsychometricTest(
        testWithRelations,
      );
    }

    return updatedTest;
  }

  async remove(id: string): Promise<void> {
    const result = await this.testRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }
  }

  async getActiveTestWithQuestions(testId: string) {
    const test = await this.testRepository.findOne({
      where: { id: testId },
      relations: ['questions', 'questions.options', 'batteryTests'],
    });
    if (!test) throw new NotFoundException('Test not found');
    const now = new Date();
    if (!test.isActive) throw new ForbiddenException('Test is inactive');
    if (test.startDate && now < new Date(test.startDate)) {
      throw new ForbiddenException('Test not started yet');
    }
    if (test.endDate && now > new Date(test.endDate)) {
      throw new ForbiddenException('Test window has ended');
    }
    return test;
  }
}
