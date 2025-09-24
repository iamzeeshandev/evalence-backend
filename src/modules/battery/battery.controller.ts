import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import { BatteryService } from './battery.service';
import { CreateBatteryDto } from './dto/create-battery.dto';
import { Battery } from './entities/battery.entity';
import { UpdateBatteryDto } from './dto/update-battery.dto';
import { Test } from 'src/modules/test/entities/test.entity';
import { DuplicateBatteryDto } from './dto/duplicate-battery.dto';
import { AddTestsToBatteryDto, RemoveTestsFromBatteryDto } from './dto/battery-test-management.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Battery')
@ApiBearerAuth('JWT-auth')
@Controller('batteries')
export class BatteryController {
  constructor(private readonly batteryService: BatteryService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get all batteries' })
  @ApiResponse({
    status: 200,
    description: 'List of all batteries',
    type: [Battery],
  })
  findAll(): Promise<Battery[]> {
    return this.batteryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get battery by ID' })
  @ApiParam({ name: 'id', description: 'Battery ID' })
  @ApiResponse({ status: 200, description: 'Battery found', type: Battery })
  @ApiResponse({ status: 404, description: 'Battery not found' })
  findOne(@Param('id') id: string): Promise<Battery> {
    return this.batteryService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new battery' })
  @ApiResponse({
    status: 201,
    description: 'Battery created successfully',
    type: Battery,
  })
  create(@Body() createBatteryDto: CreateBatteryDto): Promise<Battery> {
    return this.batteryService.create(createBatteryDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update battery by ID' })
  @ApiParam({ name: 'id', description: 'Battery ID' })
  @ApiResponse({
    status: 200,
    description: 'Battery updated successfully',
    type: Battery,
  })
  @ApiResponse({ status: 404, description: 'Battery not found' })
  update(
    @Param('id') id: string,
    @Body() updateBatteryDto: UpdateBatteryDto,
  ): Promise<Battery> {
    return this.batteryService.update(id, updateBatteryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete battery by ID' })
  @ApiParam({ name: 'id', description: 'Battery ID' })
  @ApiResponse({ status: 200, description: 'Battery deleted successfully' })
  @ApiResponse({ status: 404, description: 'Battery not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.batteryService.remove(id);
  }

  @Patch(':id/tests/add')
  @ApiOperation({ summary: 'Add tests to battery' })
  @ApiParam({ name: 'id', description: 'Battery ID' })
  @ApiResponse({
    status: 200,
    description: 'Tests added to battery successfully',
    type: Battery,
  })
  @ApiResponse({ status: 404, description: 'Battery or tests not found' })
  addTestsToBattery(
    @Param('id') id: string,
    @Body() body: AddTestsToBatteryDto,
  ): Promise<Battery> {
    return this.batteryService.addTestsToBattery(id, body.testIds);
  }

  @Patch(':id/tests/remove')
  @ApiOperation({ summary: 'Remove tests from battery' })
  @ApiParam({ name: 'id', description: 'Battery ID' })
  @ApiResponse({
    status: 200,
    description: 'Tests removed from battery successfully',
    type: Battery,
  })
  @ApiResponse({ status: 404, description: 'Battery not found' })
  removeTestsFromBattery(
    @Param('id') id: string,
    @Body() body: RemoveTestsFromBatteryDto,
  ): Promise<Battery> {
    return this.batteryService.removeTestsFromBattery(id, body.testIds);
  }

  @Get(':id/tests')
  @ApiOperation({ summary: 'Get all tests in a battery' })
  @ApiParam({ name: 'id', description: 'Battery ID' })
  @ApiResponse({
    status: 200,
    description: 'List of tests in the battery',
    type: [Test],
  })
  @ApiResponse({ status: 404, description: 'Battery not found' })
  getBatteryTests(@Param('id') id: string): Promise<Test[]> {
    return this.batteryService.getBatteryTests(id);
  }

  @Get(':id/tests/count')
  @ApiOperation({ summary: 'Get count of tests in a battery' })
  @ApiParam({ name: 'id', description: 'Battery ID' })
  @ApiResponse({
    status: 200,
    description: 'Number of tests in the battery',
    schema: { type: 'number' },
  })
  @ApiResponse({ status: 404, description: 'Battery not found' })
  getBatteryTestCount(@Param('id') id: string): Promise<number> {
    return this.batteryService.getBatteryTestCount(id);
  }

  @Get(':id/tests/:testId/exists')
  @ApiOperation({ summary: 'Check if a test exists in a battery' })
  @ApiParam({ name: 'id', description: 'Battery ID' })
  @ApiParam({ name: 'testId', description: 'Test ID' })
  @ApiResponse({
    status: 200,
    description: 'Whether the test exists in the battery',
    schema: { type: 'boolean' },
  })
  @ApiResponse({ status: 404, description: 'Battery not found' })
  isTestInBattery(
    @Param('id') id: string,
    @Param('testId') testId: string,
  ): Promise<boolean> {
    return this.batteryService.isTestInBattery(id, testId);
  }

  @Get('by-test/:testId')
  @ApiOperation({ summary: 'Get all batteries containing a specific test' })
  @ApiParam({ name: 'testId', description: 'Test ID' })
  @ApiResponse({
    status: 200,
    description: 'List of batteries containing the test',
    type: [Battery],
  })
  getBatteriesByTest(@Param('testId') testId: string): Promise<Battery[]> {
    return this.batteryService.getBatteriesByTest(testId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a battery with all its tests' })
  @ApiParam({ name: 'id', description: 'Battery ID to duplicate' })
  @ApiResponse({
    status: 201,
    description: 'Battery duplicated successfully',
    type: Battery,
  })
  @ApiResponse({ status: 404, description: 'Battery not found' })
  duplicateBattery(
    @Param('id') id: string,
    @Body() body: DuplicateBatteryDto,
  ): Promise<Battery> {
    return this.batteryService.duplicateBattery(id, body.name, body.description);
  }
}
