import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateAdminDto, CreateUserDto, LoginDto } from './dto/create-user.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CompanyService } from '../company/company.service';
import { PasswordUtil } from 'src/utils/password.util';
import { UserRole } from 'src/enums/user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
  async dropDown(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'firstName', 'lastName', 'email'],
    });
  }
  async findByCompanyId(companyId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { company: { id: companyId } },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const company = await this.companyService.findOne(dto.companyId);

    if (!company) {
      throw new NotFoundException(`Company with id ${dto.companyId} not found`);
    }

    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('User with given email already exists');
    }

    const password = dto.password.startsWith('$2b$')
      ? dto.password
      : await PasswordUtil.hashPassword(dto.password);

    const user = this.userRepository.create({
      ...dto,
      password,
      company,
    });

    return this.userRepository.save(user);
  }

  async createAdmin(dto: CreateAdminDto): Promise<User> {
    const company = await this.companyService.findOne(dto.companyId);

    if (!company) {
      throw new NotFoundException(`Company with id ${dto.companyId} not found`);
    }

    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('User with given email already exists');
    }

    // Hash password if it's not already hashed
    const password = dto.password.startsWith('$2b$')
      ? dto.password
      : await PasswordUtil.hashPassword(dto.password);

    const user = this.userRepository.create({
      ...dto,
      password,
      company,
    });

    return this.userRepository.save(user);
  }

  async login(dto: LoginDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      relations: ['company'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['company'],
    });
    return user;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  // Employee management methods for company admins
  async createEmployeeForCompany(
    createEmployeeDto: CreateEmployeeDto,
    companyId: string,
  ): Promise<User> {
    const company = await this.companyService.findOne(companyId);

    if (!company) {
      throw new NotFoundException(`Company with id ${companyId} not found`);
    }

    // Check if user already exists
    const existing = await this.userRepository.findOne({
      where: { email: createEmployeeDto.email },
    });
    if (existing) {
      throw new BadRequestException('User with given email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hashPassword(
      createEmployeeDto.password,
    );

    // Ensure role is EMPLOYEE (company admin can't create other admins)
    const userData = {
      ...createEmployeeDto,
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
    };

    const user = this.userRepository.create({
      ...userData,
      company,
    });

    return this.userRepository.save(user);
  }

  async findEmployeeInCompany(
    userId: string,
    companyId: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        company: { id: companyId },
        isDeleted: false,
      },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException(
        `Employee with ID ${userId} not found in your company`,
      );
    }

    return user;
  }

  async updateEmployeeInCompany(
    userId: string,
    updateUserDto: UpdateUserDto,
    companyId: string,
  ): Promise<User> {
    const user = await this.findEmployeeInCompany(userId, companyId);

    // If updating email, check for duplicates
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existing) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await PasswordUtil.hashPassword(
        updateUserDto.password,
      );
    }

    // Prevent role escalation - company admins can't change roles
    if (updateUserDto.role && updateUserDto.role !== UserRole.EMPLOYEE) {
      throw new BadRequestException('You can only assign EMPLOYEE role');
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async deactivateEmployeeInCompany(
    userId: string,
    companyId: string,
  ): Promise<void> {
    const user = await this.findEmployeeInCompany(userId, companyId);

    // Prevent deactivating company admin
    if (user.role === UserRole.COMPANY_ADMIN) {
      throw new BadRequestException('Cannot deactivate company admin');
    }

    await this.userRepository.update(userId, {
      isActive: false,
      isDeleted: true,
    });
  }
}
