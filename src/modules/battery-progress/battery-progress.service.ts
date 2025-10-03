import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BatteryProgress } from './entities/battery-progress.entity';
import { Battery } from '../battery/entities/battery.entity';
import { User } from '../user/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { TestAttempt } from '../assessment/test-attempt/entities/test-attempt.entity';
import { ProgressStatus } from './entities/battery-progress.entity';
import { BatteryTest } from '../battery/entities/battery-test.entity';
import { AttemptStatus } from 'src/enums/attempt.enum';

@Injectable()
export class BatteryProgressService {
  constructor(
    @InjectRepository(BatteryProgress)
    private readonly progressRepository: Repository<BatteryProgress>,
    @InjectRepository(Battery)
    private readonly batteryRepository: Repository<Battery>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepository: Repository<TestAttempt>,
    @InjectRepository(BatteryTest)
    private readonly batteryTestRepository: Repository<BatteryTest>,
  ) {}

  async findAll(): Promise<BatteryProgress[]> {
    return await this.progressRepository.find({
      relations: ['battery', 'user', 'group'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<BatteryProgress> {
    const progress = await this.progressRepository.findOne({
      where: { id },
      relations: ['battery', 'user', 'group'],
    });
    if (!progress) {
      throw new NotFoundException(`Progress record with id ${id} not found`);
    }
    return progress;
  }

  async findByUserAndBattery(
    userId: string,
    batteryId: string,
  ): Promise<BatteryProgress | null> {
    return await this.progressRepository.findOne({
      where: { userId, batteryId },
      relations: ['battery', 'user', 'group'],
    });
  }

  async getUserProgress(userId: string): Promise<BatteryProgress[]> {
    return await this.progressRepository.find({
      where: { userId },
      relations: ['battery', 'group'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getBatteryProgress(batteryId: string): Promise<BatteryProgress[]> {
    return await this.progressRepository.find({
      where: { batteryId },
      relations: ['user', 'group'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getGroupProgress(groupId: string): Promise<BatteryProgress[]> {
    return await this.progressRepository.find({
      where: { groupId },
      relations: ['battery', 'user'],
      order: { updatedAt: 'DESC' },
    });
  }

  async createOrUpdateProgress(
    userId: string,
    batteryId: string,
    testId: string,
  ): Promise<BatteryProgress> {
    // Verify entities exist
    const [user, battery, testAttempt] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId },
        relations: ['groupMemberships', 'groupMemberships.group'],
      }),
      this.batteryRepository.findOne({ where: { id: batteryId } }),
      this.testAttemptRepository.findOne({
        where: { userId, testId, batteryId },
      }),
    ]);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    if (!battery) {
      throw new NotFoundException(`Battery with id ${batteryId} not found`);
    }
    if (!testAttempt) {
      throw new NotFoundException(
        `Test attempt not found for user ${userId} and test ${testId}`,
      );
    }

    if (!user.groupMemberships || user.groupMemberships.length === 0) {
      throw new BadRequestException('User must belong to a group');
    }

    const group = user.groupMemberships[0].group; // User belongs to exactly one group

    // Find existing progress or create new
    let progress = await this.findByUserAndBattery(userId, batteryId);

    if (!progress) {
      progress = this.progressRepository.create({
        userId,
        batteryId,
        groupId: group.id,
        status: ProgressStatus.NOT_STARTED,
        completedTests: 0,
        totalTests: await this.batteryTestRepository.count({
          where: { batteryId },
        }),
        progressPercentage: 0,
      });
    }

    // Update progress based on test attempt
    await this.updateProgressFromTestAttempt(progress, testAttempt);

    return this.progressRepository.save(progress);
  }

  private async updateProgressFromTestAttempt(
    progress: BatteryProgress,
    testAttempt: TestAttempt,
  ): Promise<void> {
    // Fetch all test attempts for this user+battery that are submitted
    const attempts = await this.testAttemptRepository.find({
      where: {
        userId: progress.userId,
        batteryId: progress.batteryId,
        status: AttemptStatus.SUBMITTED as any,
      },
    });

    // Fetch battery test weights
    const weights = await this.batteryTestRepository.find({
      where: { batteryId: progress.batteryId },
    });
    const weightByTest = new Map<string, number>(
      weights.map((w) => [w.testId, Number(w.weight)] as const),
    );

    // Determine total tests via weights fallback to battery
    const totalTests = weights.length;

    // Compute weighted progress: sum(weight * attempt.percentage/100) across best attempt per test
    const bestByTest = new Map<string, TestAttempt>();
    for (const a of attempts) {
      const prev = bestByTest.get(a.testId);
      if (!prev || Number(a.percentage) > Number(prev.percentage)) {
        bestByTest.set(a.testId, a);
      }
    }

    let weighted = 0;
    let completedCount = 0;
    for (const [testId, attempt] of bestByTest.entries()) {
      const weight =
        weightByTest.get(testId) ?? (totalTests > 0 ? 100 / totalTests : 0);
      const pct = Number(attempt.percentage) || 0;
      if (pct >= 100) completedCount += 1;
      weighted += (weight * pct) / 100;
    }

    progress.completedTests = completedCount;
    progress.lastAttemptAt = new Date();

    // Update status and percentage (weighted)
    if (progress.completedTests === 0) {
      progress.status = ProgressStatus.NOT_STARTED;
      progress.startedAt = null;
    } else if (progress.completedTests < progress.totalTests) {
      progress.status = ProgressStatus.IN_PROGRESS;
      if (!progress.startedAt) {
        progress.startedAt = new Date();
      }
    } else {
      progress.status = ProgressStatus.COMPLETED;
      if (!progress.startedAt) {
        progress.startedAt = new Date();
      }
      if (!progress.completedAt) {
        progress.completedAt = new Date();
      }
    }

    // Weighted percentage
    progress.progressPercentage = Number(weighted.toFixed(2));
  }

  async getProgressStats(): Promise<{
    totalProgressRecords: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    averageProgress: number;
  }> {
    const [total, notStarted, inProgress, completed] = await Promise.all([
      this.progressRepository.count(),
      this.progressRepository.count({
        where: { status: ProgressStatus.NOT_STARTED },
      }),
      this.progressRepository.count({
        where: { status: ProgressStatus.IN_PROGRESS },
      }),
      this.progressRepository.count({
        where: { status: ProgressStatus.COMPLETED },
      }),
    ]);

    // Calculate average progress percentage
    const result = await this.progressRepository
      .createQueryBuilder('progress')
      .select('AVG(progress.progressPercentage)', 'average')
      .getRawOne();

    const averageProgress = parseFloat(result.average) || 0;

    return {
      totalProgressRecords: total,
      notStarted,
      inProgress,
      completed,
      averageProgress: Math.round(averageProgress * 100) / 100,
    };
  }

  async getCompanyProgressStats(companyId: string): Promise<{
    totalUsers: number;
    totalBatteries: number;
    averageProgress: number;
    completionRate: number;
  }> {
    // Get all groups in the company
    const groups = await this.groupRepository.find({
      where: { company: { id: companyId } },
    });

    if (groups.length === 0) {
      return {
        totalUsers: 0,
        totalBatteries: 0,
        averageProgress: 0,
        completionRate: 0,
      };
    }

    const groupIds = groups.map((group) => group.id);

    // Get progress records for all groups in the company
    const progressRecords = await this.progressRepository.find({
      where: { groupId: In(groupIds) },
    });

    const totalUsers = new Set(progressRecords.map((p) => p.userId)).size;
    const totalBatteries = new Set(progressRecords.map((p) => p.batteryId))
      .size;

    const averageProgress =
      progressRecords.length > 0
        ? progressRecords.reduce((sum, p) => sum + p.progressPercentage, 0) /
          progressRecords.length
        : 0;

    const completedRecords = progressRecords.filter(
      (p) => p.status === ProgressStatus.COMPLETED,
    );
    const completionRate =
      progressRecords.length > 0
        ? (completedRecords.length / progressRecords.length) * 100
        : 0;

    return {
      totalUsers,
      totalBatteries,
      averageProgress: Math.round(averageProgress * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }
}
