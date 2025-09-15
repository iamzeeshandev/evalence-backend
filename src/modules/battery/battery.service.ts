import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Battery } from './entities/battery.entity';
import { CreateBatteryDto } from './dto/create-battery.dto';
import { UpdateBatteryDto } from './dto/update-battery.dto';
import { Test } from 'src/modules/test/entities/test.entity';

@Injectable()
export class BatteryService {
  constructor(
    @InjectRepository(Battery)
    private batteryRepository: Repository<Battery>,
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
  ) {}

  async findAll(): Promise<Battery[]> {
    return await this.batteryRepository.find({
      relations: ['tests', 'tests.questions', 'tests.questions.options'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Battery> {
    const battery = await this.batteryRepository.findOne({
      where: { id },
      relations: ['tests', 'tests.questions', 'tests.questions.options'],
    });

    if (!battery) {
      throw new NotFoundException(`Battery with ID ${id} not found`);
    }

    return battery;
  }

  async create(createBatteryDto: CreateBatteryDto): Promise<Battery> {
    const { testIds, ...batteryData } = createBatteryDto;

    const battery = this.batteryRepository.create(batteryData);

    // If testIds are provided, fetch the tests and assign them
    if (testIds && testIds.length > 0) {
      const tests = await this.testRepository.findByIds(testIds);
      if (tests.length !== testIds.length) {
        throw new NotFoundException('One or more tests not found');
      }
      battery.tests = tests;
    }

    return await this.batteryRepository.save(battery);
  }

  async update(
    id: string,
    updateBatteryDto: UpdateBatteryDto,
  ): Promise<Battery> {
    const battery = await this.findOne(id);
    const { testIds, ...batteryData } = updateBatteryDto;

    Object.assign(battery, batteryData);

    // If testIds are provided, update the tests relationship
    if (testIds !== undefined) {
      if (testIds.length > 0) {
        const tests = await this.testRepository.findByIds(testIds);
        if (tests.length !== testIds.length) {
          throw new NotFoundException('One or more tests not found');
        }
        battery.tests = tests;
      } else {
        battery.tests = [];
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
    testIds: string[],
  ): Promise<Battery> {
    const battery = await this.findOne(batteryId);
    const tests = await this.testRepository.findByIds(testIds);

    if (tests.length !== testIds.length) {
      throw new NotFoundException('One or more tests not found');
    }

    // Add new tests to existing ones (avoid duplicates)
    const existingTestIds = battery.tests.map((test) => test.id);
    const newTests = tests.filter((test) => !existingTestIds.includes(test.id));
    battery.tests = [...battery.tests, ...newTests];

    return await this.batteryRepository.save(battery);
  }

  async removeTestsFromBattery(
    batteryId: string,
    testIds: string[],
  ): Promise<Battery> {
    const battery = await this.findOne(batteryId);

    // Remove specified tests
    battery.tests = battery.tests.filter((test) => !testIds.includes(test.id));

    return await this.batteryRepository.save(battery);
  }
}
