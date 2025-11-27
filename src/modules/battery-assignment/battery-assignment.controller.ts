import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BatteryAssignmentService } from './battery-assignment.service';
import { BatteryGroupAssignment } from './entities/battery-group-assignment.entity';
import {
  CreateBatteryAssignmentDto,
  UpdateBatteryAssignmentDto,
  AssignBatteryToGroupDto,
  AssignBatteryToMultipleGroupsDto,
} from './dto/battery-assignment.dto';
import { Battery } from '../battery/entities/battery.entity';
import { Test } from '../test/entities/test.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/interfaces/auth.interface';

@ApiBearerAuth('JWT-auth')
@ApiTags('Battery Assignment')
@Controller('battery-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BatteryAssignmentController {
  constructor(
    private readonly batteryAssignmentService: BatteryAssignmentService,
  ) {}

  @Post('save')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateBatteryAssignmentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<BatteryGroupAssignment> {
    return this.batteryAssignmentService.create(createDto, req.user.userId);
  }

  @Get('list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async findAll(): Promise<BatteryGroupAssignment[]> {
    return this.batteryAssignmentService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async findOne(@Param('id') id: string): Promise<BatteryGroupAssignment> {
    return this.batteryAssignmentService.findOne(id);
  }

  @Put('update/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBatteryAssignmentDto,
  ): Promise<BatteryGroupAssignment> {
    return this.batteryAssignmentService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.batteryAssignmentService.remove(id);
  }

  @Post('assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async assignBatteryToGroup(
    @Body() assignDto: AssignBatteryToGroupDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<BatteryGroupAssignment> {
    return this.batteryAssignmentService.assignBatteryToGroup(
      assignDto,
      req.user.userId,
    );
  }

  @Post('assign-multiple')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async assignBatteryToMultipleGroups(
    @Body() assignDto: AssignBatteryToMultipleGroupsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<BatteryGroupAssignment[]> {
    return this.batteryAssignmentService.assignBatteryToMultipleGroups(
      assignDto,
      req.user.userId,
    );
  }

  @Get('group/:groupId/batteries')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getBatteriesByGroup(
    @Param('groupId') groupId: string,
  ): Promise<BatteryGroupAssignment[]> {
    return this.batteryAssignmentService.getBatteriesByGroup(groupId);
  }

  @Get('battery/:batteryId/groups')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getGroupsByBattery(
    @Param('batteryId') batteryId: string,
  ): Promise<BatteryGroupAssignment[]> {
    return this.batteryAssignmentService.getGroupsByBattery(batteryId);
  }

  @Get('user/:userId/accessible-batteries')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  async getUserAccessibleBatteries(
    @Param('userId') userId: string,
  ): Promise<Battery[]> {
    return this.batteryAssignmentService.getUserAccessibleBatteries(userId);
  }

  @Get('user/:userId/accessible-tests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  async getUserAccessibleTests(
    @Param('userId') userId: string,
  ): Promise<Test[]> {
    return this.batteryAssignmentService.getUserAccessibleTests(userId);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getAssignmentStats() {
    return this.batteryAssignmentService.getAssignmentStats();
  }
}
