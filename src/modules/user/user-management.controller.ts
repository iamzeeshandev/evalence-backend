import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { User } from './entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthenticatedRequest } from '../auth/interfaces/auth.interface';

@ApiTags('User Management')
@Controller('user-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserManagementController {
  constructor(private readonly userService: UserService) {}

  @Post('employees')
  @Roles(UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add employee to company',
    description: 'Company admin can add new employees to their company',
  })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
    type: User,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or email already exists',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only company admins can add employees',
  })
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<User> {
    const companyId = req.user.companyId;
    return this.userService.createEmployeeForCompany(
      createEmployeeDto,
      companyId,
    );
  }

  @Get('employees')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Get all employees in company',
    description: 'Company admin can view all employees in their company',
  })
  @ApiResponse({
    status: 200,
    description: 'List of employees in the company',
    type: [User],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only company admins can view employees',
  })
  async getCompanyEmployees(
    @Request() req: AuthenticatedRequest,
  ): Promise<User[]> {
    const companyId = req.user.companyId;
    return this.userService.findByCompanyId(companyId);
  }

  @Get('employees/:id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Get employee by ID',
    description: 'Company admin can view specific employee details',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee details',
    type: User,
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only company admins can view employee details',
  })
  async getEmployee(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<User> {
    const companyId = req.user.companyId;
    return this.userService.findEmployeeInCompany(id, companyId);
  }

  @Put('employees/:id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Update employee',
    description: 'Company admin can update employee details',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee updated successfully',
    type: User,
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only company admins can update employees',
  })
  async updateEmployee(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<User> {
    const companyId = req.user.companyId;
    return this.userService.updateEmployeeInCompany(
      id,
      updateUserDto,
      companyId,
    );
  }

  @Delete('employees/:id')
  @Roles(UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate employee',
    description: 'Company admin can deactivate employee (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({
    status: 204,
    description: 'Employee deactivated successfully',
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Only company admins can deactivate employees',
  })
  async deactivateEmployee(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    const companyId = req.user.companyId;
    return this.userService.deactivateEmployeeInCompany(id, companyId);
  }
}
