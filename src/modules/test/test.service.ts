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
import { TestAssignmentsService } from '../assessment/test-assignment/test-assignment.service';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
    private testAssignmentsService: TestAssignmentsService,
  ) {}

  async findAll(): Promise<Test[]> {
    return await this.testRepository.find({
      relations: ['questions', 'questions.options'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id },
      relations: ['questions', 'questions.options'],
    });

    if (!test) {
      throw new NotFoundException(`Test with ID ${id} not found`);
    }

    return test;
  }

  async findCompanyTests(companyId: string) {
    const result =
      await this.testAssignmentsService.findCompanyTests(companyId);
    return result;
  }
  async findUserTests(userId: string) {
    const result = await this.testAssignmentsService.findUserTests(userId);
    return result;
  }

  async create(createTestDto: CreateTestDto): Promise<Test> {
    const { questions } = createTestDto;
    console.log('Creating test with questions:', { questions });
    const test = this.testRepository.create(createTestDto);
    return await this.testRepository.save(test);
  }

  async update(id: string, updateTestDto: UpdateTestDto): Promise<Test> {
    const test = await this.findOne(id);
    Object.assign(test, updateTestDto);
    return await this.testRepository.save(test);
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
      relations: ['questions', 'questions.options'],
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
