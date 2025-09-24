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
import { CreateAdminDto, CreateUserDto } from './dto/create-user.dto';
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
    return await this.userRepository.find({
      where: { isDeleted: false },
    });
  }
  async dropDown(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'firstName', 'lastName', 'email'],
    });
  }
  async findByCompanyId(companyId: string): Promise<User[]> {
    return await this.userRepository.find({
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


  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['company'],
    });
    return user;
  }

  async findUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['company'],
    });
    return user;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }


  // Unified methods for the new controller
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

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

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    // Prevent deactivating super admin
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot deactivate super admin');
    }

    await this.userRepository.update(id, {
      isActive: false,
      isDeleted: true,
    });
  }

  async createUserForCompany(
    createUserDto: CreateUserDto,
    companyId: string,
  ): Promise<User> {
    const company = await this.companyService.findOne(companyId);

    if (!company) {
      throw new NotFoundException(`Company with id ${companyId} not found`);
    }

    // Check if user already exists
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new BadRequestException('User with given email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hashPassword(
      createUserDto.password,
    );

    // Ensure role is EMPLOYEE (company admin can't create other admins)
    const userData = {
      ...createUserDto,
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
    };

    const user = this.userRepository.create({
      ...userData,
      company,
    });

    return this.userRepository.save(user);
  }

  async findUserInCompany(
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
        `User with ID ${userId} not found in your company`,
      );
    }

    return user;
  }

  async updateUserInCompany(
    userId: string,
    updateUserDto: UpdateUserDto,
    companyId: string,
  ): Promise<User> {
    const user = await this.findUserInCompany(userId, companyId);

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

  async deactivateUserInCompany(
    userId: string,
    companyId: string,
  ): Promise<void> {
    const user = await this.findUserInCompany(userId, companyId);

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
