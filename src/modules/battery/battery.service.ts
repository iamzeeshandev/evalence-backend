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
    // Load battery without relations to avoid cascade issues
    const battery = await this.batteryRepository.findOne({
      where: { id },
    });
    
    if (!battery) {
      throw new NotFoundException(`Battery with ID ${id} not found`);
    }

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

    // Delete all existing battery tests for this battery
    await this.batteryTestRepository.delete({ batteryId });

    // Create new battery test records
    if (tests.length > 0) {
      const rows = tests.map((test) =>
        this.batteryTestRepository.create({
          batteryId,
          testId: test.testId,
          weight: test.weight,
        }),
      );
      await this.batteryTestRepository.save(rows);
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

    // Delete all existing battery tests for this battery
    await this.batteryTestRepository.delete({ batteryId });

    // Create new battery test records
    if (tests.length > 0) {
      const rows = tests.map((test) =>
        this.batteryTestRepository.create({
          batteryId,
          testId: test.testId,
          weight: test.weight,
        }),
      );
      await this.batteryTestRepository.save(rows);
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
      const rows = originalBT.map((bt) =>
        this.batteryTestRepository.create({
          batteryId: newBattery.id,
          testId: bt.testId,
          weight: bt.weight,
        }),
      );
      await this.batteryTestRepository.save(rows);
    }

    return await this.findOne(newBattery.id);
  }

  async setBatteryTestWeights(
    items: { batteryId: string; testId: string; weight: number }[],
  ): Promise<void> {
    if (!items || items.length === 0) return;
    
    // Group items by batteryId
    const byBattery = new Map<string, { testId: string; weight: number }[]>();
    for (const item of items) {
      const arr = byBattery.get(item.batteryId) || [];
      arr.push({ testId: item.testId, weight: item.weight });
      byBattery.set(item.batteryId, arr);
    }

    // Process each battery
    for (const [batteryId, arr] of byBattery.entries()) {
      // Delete all existing battery tests for this battery
      await this.batteryTestRepository.delete({ batteryId });
      
      // Validate that weights sum to 100
      const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight !== 100) {
        throw new BadRequestException(
          `Sum of test weights must equal 100, got ${totalWeight}`,
        );
      }
      
      // Create new battery test records
      if (arr.length > 0) {
        const testIds = arr.map((item) => item.testId);
        const existingTests = await this.testRepository.findByIds(testIds);
        if (existingTests.length !== testIds.length) {
          throw new NotFoundException('One or more tests not found');
        }
        
        const rows = arr.map((item) =>
          this.batteryTestRepository.create({
            batteryId,
            testId: item.testId,
            weight: item.weight,
          }),
        );
        await this.batteryTestRepository.save(rows);
      }
    }
  }
}
