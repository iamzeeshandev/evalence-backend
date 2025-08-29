import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { TestAssignment } from './entities/test-assignment.entity';
import {
  AssignTestToCompanyDto,
  AssignTestToUserDto,
  CreateTestAssignmentDto,
  ListTestAssignmentsDto,
  ListUserTestAssignmentsDto,
} from './dto/create-test-assignment.dto';
import { UserTestAssignment } from './entities/user-test-assignments.entity';
import { Test } from 'src/modules/test/entities/test.entity';

@Injectable()
export class TestAssignmentsService {
  constructor(
    @InjectRepository(TestAssignment)
    private readonly repository: Repository<TestAssignment>,
    @InjectRepository(UserTestAssignment)
    private readonly userAssignRepo: Repository<UserTestAssignment>,
  ) {}

  async findAll() {
    return await this.repository.find({
      relations: [
        'test',
        'company',
        'test.questions',
        'test.questions.options',
      ],
    });
  }

  async findCompanyTests(companyId: string) {
    return this.repository.manager.getRepository(Test).find({
      where: {
        testAssignments: { companyId },
      },
      relations: ['questions', 'questions.options'],
    });
  }

  async findUserTests(userId: string) {
    return await this.repository.manager.getRepository(Test).find({
      where: {
        testAssignments: {
          userAssignments: { userId },
        },
      },
      relations: ['questions', 'questions.options'],
    });
  }
  // async findUserTests(userId: string, companyId: string) {
  //   const assignment = await this.repository.findOne({
  //     where: { companyId },
  //   });
  //   return await this.userAssignRepo.find({
  //     where: {
  //       assignment: {
  //         id: assignment?.id,
  //       },
  //       user: {
  //         id: userId,
  //       },
  //     },
  //     relations: [
  //       'user',
  //       'assignment',
  //       'assignment.test',
  //       'assignment.test.questions',
  //       'assignment.test.questions.options',
  //     ],
  //   });
  // }

  async findAllUserAssignments(userId: string) {
    return await this.repository.find({
      where: {
        test: {
          testAssignments: {
            userAssignments: { userId },
          },
        },
      },
      relations: [
        'userAssignments',
        'test',
        'test.questions',
        'test.questions.options',
      ],
    });
  }

  async findIndividualCompanyAssignments(companyId: string) {
    return await this.repository.find({
      where: { companyId },
      relations: [
        'test',
        'company',
        'test.questions',
        'test.questions.options',
      ],
    });
  }
  async findIndividualUserAssignments(userId: string, companyId: string) {
    const assignment = await this.repository.findOne({
      where: { companyId },
    });
    return await this.userAssignRepo.find({
      where: {
        assignment: {
          id: assignment?.id,
        },
        user: {
          id: userId,
        },
      },
      relations: [
        'user',
        'assignment',
        'assignment.test',
        'assignment.test.questions',
        'assignment.test.questions.options',
      ],
    });
  }
  async findAllUsersAssignments() {
    return await this.repository.find({
      relations: [
        'userAssignments',
        'userAssignments.test',
        'userAssignments.test.questions',
        'userAssignments.test.questions.options',
      ],
    });
  }

  async findOne(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  async create(dto: CreateTestAssignmentDto) {
    const { testId, companyId } = dto;
    console.log('Creating test assignment:', { testId, companyId });
    const existing = await this.repository.findOne({
      where: { testId: dto.testId, companyId: dto.userId },
    });
    if (existing) throw new ConflictException('Assignment already exists');

    const entity = this.repository.create({
      ...dto,
      dueAt: dto.dueAt ?? null,
    });
    return this.repository.save(entity);
  }

  async assignTestToCompany(dto: AssignTestToCompanyDto) {
    const { testId, companyId, ...rest } = dto;

    const existing = await this.repository.findOne({
      where: { testId, companyId },
    });
    if (existing)
      throw new ConflictException('Test already assigned to this company');

    const entity = this.repository.create({
      testId,
      companyId,
      isActive: true,
      ...rest,
    });
    return this.repository.save(entity);
  }

  async assignTestToUser(dto: AssignTestToUserDto) {
    const { testId, companyId, userId } = dto;

    // parent company assignment must exist and be active
    const parent = await this.repository.findOne({
      where: { testId, companyId },
    });
    if (!parent)
      throw new ForbiddenException('Test not assigned to this company');
    if (!parent.isActive)
      throw new ForbiddenException('Company assignment is inactive');

    // prevent duplicate user assignment
    const already = await this.userAssignRepo.findOne({
      where: { assignmentId: parent.id, userId },
    });
    if (already)
      throw new ConflictException('Test already assigned to this user');

    const child = this.userAssignRepo.create({
      assignmentId: parent.id,
      userId,
      maxAttempts: dto.maxAttempts ?? parent.maxAttempts ?? 1,
      dueAt: dto.dueAt ?? parent.dueAt ?? null,
      isActive: true,
    });

    return this.userAssignRepo.save(child);
  }

  // async assignTestToUser(dto: AssignTestToUserDto) {
  //   const { testId, userId } = dto;
  //   console.log('Assigning user to test:', { testId, userId });
  //   const existing = await this.repository.findOne({
  //     where: { testId: dto.testId, userId: dto.userId },
  //   });
  //   if (existing) throw new ConflictException('Assignment already exists');

  //   const entity = this.repository.create(dto);
  //   return this.repository.save(entity);
  // }

  async list(filters: ListTestAssignmentsDto) {
    const where: FindOptionsWhere<TestAssignment> = {};
    if (filters.testId) where.testId = filters.testId;
    if (filters.companyId) where.companyId = filters.companyId;
    return this.repository.find({ where, order: { createdAt: 'DESC' } });
  }

  async userList(filters: ListUserTestAssignmentsDto) {
    const where: FindOptionsWhere<UserTestAssignment> = {};
    if (filters.userAssignmentId) where.id = filters.userAssignmentId;
    if (filters.userId) where.userId = filters.userId;
    return this.userAssignRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async disable(id: string) {
    await this.repository.update(id, { isActive: false });
    return this.repository.findOne({ where: { id } });
  }

  async findUserAssignment(userId: string, assignmentId: string) {
    return this.userAssignRepo.findOne({
      where: { userId, id: assignmentId },
    });
  }
}
