import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Battery } from './entities/battery.entity';
import { CreateBatteryDto } from './dto/create-battery.dto';
import { UpdateBatteryDto } from './dto/update-battery.dto';
import { Test } from 'src/modules/test/entities/test.entity';
import { BatteryTest } from './entities/battery-test.entity';

@Injectable()
export class BatteryService {
  constructor(
    @InjectRepository(Battery)
    private batteryRepository: Repository<Battery>,
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
    @InjectRepository(BatteryTest)
    private batteryTestRepository: Repository<BatteryTest>,
  ) {}

  async findAll(): Promise<Battery[]> {
    return await this.batteryRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['batteryTests'],
    });
  }

  async findOne(id: string): Promise<Battery> {
    const battery = await this.batteryRepository.findOne({
      where: { id },
      relations: ['batteryTests', 'batteryTests.test'],
    });

    if (!battery) {
      throw new NotFoundException(`Battery with ID ${id} not found`);
    }

    return battery;
  }

  async create(createBatteryDto: CreateBatteryDto): Promise<Battery> {
    const { testIds, tests, ...batteryData } = createBatteryDto;

    // Validate that either tests or testIds is provided, not both
    if (tests && testIds) {
      throw new BadRequestException(
        'Provide either tests array with weights or testIds array, not both',
      );
    }

    // Determine which format to use
    let testWeights: { testId: string; weight: number }[] = [];

    if (tests && tests.length > 0) {
      // Validate sum of weights
      const totalWeight = tests.reduce((sum, t) => sum + t.weight, 0);
      if (totalWeight !== 100) {
        throw new BadRequestException(
          `Sum of test weights must equal 100, got ${totalWeight}`,
        );
      }
      testWeights = tests.map((t) => ({ testId: t.testId, weight: t.weight }));
    } else if (testIds && testIds.length > 0) {
      // Legacy: equal weights
      const equalWeight = 100 / testIds.length;
      testWeights = testIds.map((id) => ({ testId: id, weight: equalWeight }));
    }

    const battery = this.batteryRepository.create(batteryData);
    const saved = await this.batteryRepository.save(battery);

    // Create BatteryTest rows with weights
    if (testWeights.length > 0) {
      const allTestIds = testWeights.map((t) => t.testId);
      const existingTests = await this.testRepository.findByIds(allTestIds);
      if (existingTests.length !== allTestIds.length) {
        throw new NotFoundException('One or more tests not found');
      }

      const rows = testWeights.map((t) =>
        this.batteryTestRepository.create({
          batteryId: saved.id,
          testId: t.testId,
          weight: t.weight,
        }),
      );
      await this.batteryTestRepository.save(rows);
    }

    return await this.findOne(saved.id);
  }

  async update(
    id: string,
    updateBatteryDto: UpdateBatteryDto,
  ): Promise<Battery> {
    const battery = await this.findOne(id);
    const { testIds, tests, ...batteryData } = updateBatteryDto;

    Object.assign(battery, batteryData);

    // Validate that either tests or testIds is provided, not both
    if (tests && testIds) {
      throw new BadRequestException(
        'Provide either tests array with weights or testIds array, not both',
      );
    }

    // If tests or testIds are provided, update associations in battery_test_weights
    if (tests !== undefined || testIds !== undefined) {
      let testWeights: { testId: string; weight: number }[] = [];

      if (tests && tests.length > 0) {
        // Validate sum of weights
        const totalWeight = tests.reduce((sum, t) => sum + t.weight, 0);
        if (totalWeight !== 100) {
          throw new BadRequestException(
            `Sum of test weights must equal 100, got ${totalWeight}`,
          );
        }
        testWeights = tests.map((t) => ({
          testId: t.testId,
          weight: t.weight,
        }));
      } else if (testIds && testIds.length > 0) {
        // Legacy: equal weights
        const equalWeight = 100 / testIds.length;
        testWeights = testIds.map((id) => ({
          testId: id,
          weight: equalWeight,
        }));
      }

      // Remove all existing associations
      await this.batteryTestRepository.delete({ batteryId: battery.id });

      // Create new associations with weights
      if (testWeights.length > 0) {
        const allTestIds = testWeights.map((t) => t.testId);
        const existingTests = await this.testRepository.findByIds(allTestIds);
        if (existingTests.length !== allTestIds.length) {
          throw new NotFoundException('One or more tests not found');
        }

        const rows = testWeights.map((t) =>
          this.batteryTestRepository.create({
            batteryId: battery.id,
            testId: t.testId,
            weight: t.weight,
          }),
        );
        await this.batteryTestRepository.save(rows);
      }
    }

    return await this.batteryRepository.save(battery);
  }

  async remove(id: string): Promise<void> {
    const result = await this.batteryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Battery with ID ${id} not found`);
    }
  }

  async addTestsToBattery(
    batteryId: string,
    tests: { testId: string; weight: number }[],
  ): Promise<Battery> {
    // Validate sum of weights equals 100
    const totalWeight = tests.reduce((sum, t) => sum + t.weight, 0);
    if (totalWeight !== 100) {
      throw new BadRequestException(
        `Sum of test weights must equal 100, got ${totalWeight}`,
      );
    }

    // Validate all test IDs exist
    const allTestIds = tests.map((t) => t.testId);
    const existingTests = await this.testRepository.findByIds(allTestIds);
    if (existingTests.length !== allTestIds.length) {
      throw new NotFoundException('One or more tests not found');
    }

    // Get existing battery tests
    const existingBatteryTests = await this.batteryTestRepository.find({
      where: { batteryId },
    });

    // Create a map of existing tests for quick lookup
    const existingMap = new Map(
      existingBatteryTests.map((bt) => [bt.testId, bt] as const),
    );

    // Prepare all tests to save (both existing and new)
    const testsToSave: BatteryTest[] = [];

    for (const test of tests) {
      const existing = existingMap.get(test.testId);
      if (existing) {
        // Update existing test weight
        existing.weight = test.weight;
        testsToSave.push(existing);
      } else {
        // Create new test association
        testsToSave.push(
          this.batteryTestRepository.create({
            batteryId,
            testId: test.testId,
            weight: test.weight,
          }),
        );
      }
    }

    // Remove tests that are no longer in the list
    const newTestIds = new Set(tests.map((t) => t.testId));
    const toRemove = existingBatteryTests.filter(
      (bt) => !newTestIds.has(bt.testId),
    );

    if (toRemove.length > 0) {
      await this.batteryTestRepository.remove(toRemove);
    }

    // Save all tests (both updated and new)
    if (testsToSave.length > 0) {
      await this.batteryTestRepository.save(testsToSave);
    }

    return await this.findOne(batteryId);
  }

  async removeTestsFromBattery(
    batteryId: string,
    tests: { testId: string; weight: number }[],
  ): Promise<Battery> {
    // Validate sum of weights equals 100
    const totalWeight = tests.reduce((sum, t) => sum + t.weight, 0);
    if (totalWeight !== 100) {
      throw new BadRequestException(
        `Sum of test weights must equal 100, got ${totalWeight}`,
      );
    }

    // Validate all test IDs exist
    const allTestIds = tests.map((t) => t.testId);
    const existingTests = await this.testRepository.findByIds(allTestIds);
    if (existingTests.length !== allTestIds.length) {
      throw new NotFoundException('One or more tests not found');
    }

    // Get existing battery tests
    const existingBatteryTests = await this.batteryTestRepository.find({
      where: { batteryId },
    });

    // Create a map of existing tests for quick lookup
    const existingMap = new Map(
      existingBatteryTests.map((bt) => [bt.testId, bt] as const),
    );

    // Prepare tests to save (remaining tests with updated weights)
    const testsToSave: BatteryTest[] = [];

    for (const test of tests) {
      const existing = existingMap.get(test.testId);
      if (existing) {
        // Update existing test weight
        existing.weight = test.weight;
        testsToSave.push(existing);
      } else {
        // This shouldn't happen if validation is correct, but handle gracefully
        throw new BadRequestException(
          `Test ${test.testId} is not currently in the battery`,
        );
      }
    }

    // Remove tests that are no longer in the list
    const remainingTestIds = new Set(tests.map((t) => t.testId));
    const toRemove = existingBatteryTests.filter(
      (bt) => !remainingTestIds.has(bt.testId),
    );

    if (toRemove.length > 0) {
      await this.batteryTestRepository.remove(toRemove);
    }

    // Save remaining tests with updated weights
    if (testsToSave.length > 0) {
      await this.batteryTestRepository.save(testsToSave);
    }

    return await this.findOne(batteryId);
  }

  async getBatteryTests(batteryId: string): Promise<Test[]> {
    const joins = await this.batteryTestRepository.find({
      where: { batteryId },
    });
    if (joins.length === 0) return [];
    const tests = await this.testRepository.findByIds(
      joins.map((j) => j.testId),
    );
    return tests;
  }

  async getBatteryTestCount(batteryId: string): Promise<number> {
    return await this.batteryTestRepository.count({ where: { batteryId } });
  }

  async isTestInBattery(batteryId: string, testId: string): Promise<boolean> {
    const count = await this.batteryTestRepository.count({
      where: { batteryId, testId },
    });
    return count > 0;
  }

  async getBatteriesByTest(testId: string): Promise<Battery[]> {
    const rows = await this.batteryTestRepository.find({ where: { testId } });
    if (rows.length === 0) return [];
    const ids = [...new Set(rows.map((r) => r.batteryId))];
    return await this.batteryRepository.findByIds(ids);
  }

  async duplicateBattery(
    batteryId: string,
    newName: string,
    newDescription?: string,
  ): Promise<Battery> {
    const originalBattery = await this.findOne(batteryId);

    const newBattery = await this.batteryRepository.save(
      this.batteryRepository.create({
        name: newName,
        description: newDescription || originalBattery.description,
        isActive: originalBattery.isActive,
      }),
    );

    // Copy battery_tests weights
    const originalBT = await this.batteryTestRepository.find({
      where: { batteryId: originalBattery.id },
    });
    if (originalBT.length > 0) {
      await this.batteryTestRepository.save(
        originalBT.map((bt) =>
          this.batteryTestRepository.create({
            batteryId: newBattery.id,
            testId: bt.testId,
            weight: bt.weight,
          }),
        ),
      );
    }

    return await this.findOne(newBattery.id);
  }

  async setBatteryTestWeights(
    items: { batteryId: string; testId: string; weight: number }[],
  ): Promise<void> {
    if (!items || items.length === 0) return;
    const byBattery = new Map<string, { testId: string; weight: number }[]>();
    for (const item of items) {
      const arr = byBattery.get(item.batteryId) || [];
      arr.push({ testId: item.testId, weight: item.weight });
      byBattery.set(item.batteryId, arr);
    }

    for (const [batteryId, arr] of byBattery.entries()) {
      // Ensure associations exist
      const testIds = arr.map((a) => a.testId);
      const existing = await this.batteryTestRepository.find({
        where: { batteryId },
      });
      const existingMap = new Map(existing.map((e) => [e.testId, e] as const));

      const rowsToSave: BatteryTest[] = [];
      for (const a of arr) {
        const row =
          existingMap.get(a.testId) ||
          this.batteryTestRepository.create({ batteryId, testId: a.testId });
        row.weight = Number(a.weight);
        rowsToSave.push(row);
      }
      if (rowsToSave.length > 0)
        await this.batteryTestRepository.save(rowsToSave);
    }
  }
}
