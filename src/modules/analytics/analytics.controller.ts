import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BatteryAssignmentService } from '../battery-assignment/battery-assignment.service';
import { BatteryProgressService } from '../battery-progress/battery-progress.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Analytics & Reporting')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly batteryAssignmentService: BatteryAssignmentService,
    private readonly batteryProgressService: BatteryProgressService,
  ) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getOverview() {
    const [assignmentStats, progressStats] = await Promise.all([
      this.batteryAssignmentService.getAssignmentStats(),
      this.batteryProgressService.getProgressStats(),
    ]);

    return {
      assignments: assignmentStats,
      progress: progressStats,
    };
  }

  @Get('company/:companyId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getCompanyAnalytics(@Param('companyId') companyId: string) {
    return this.batteryProgressService.getCompanyProgressStats(companyId);
  }

  @Get('battery/:batteryId/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getBatteryProgress(@Param('batteryId') batteryId: string) {
    return this.batteryProgressService.getBatteryProgress(batteryId);
  }

  @Get('group/:groupId/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getGroupProgress(@Param('groupId') groupId: string) {
    return this.batteryProgressService.getGroupProgress(groupId);
  }

  @Get('user/:userId/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getUserProgress(@Param('userId') userId: string) {
    return this.batteryProgressService.getUserProgress(userId);
  }

  @Get('battery/:batteryId/assignments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getBatteryAssignments(@Param('batteryId') batteryId: string) {
    return this.batteryAssignmentService.getGroupsByBattery(batteryId);
  }

  @Get('group/:groupId/batteries')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async getGroupBatteries(@Param('groupId') groupId: string) {
    return this.batteryAssignmentService.getBatteriesByGroup(groupId);
  }

  @Get('user/:userId/accessible-batteries')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  async getUserAccessibleBatteries(@Param('userId') userId: string) {
    return this.batteryAssignmentService.getUserAccessibleBatteries(userId);
  }
}

