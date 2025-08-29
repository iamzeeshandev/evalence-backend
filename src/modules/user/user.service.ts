import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, LoginDto } from './dto/create-user.dto';
import { CompanyService } from '../company/company.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly companyService: CompanyService,
  ) {}

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

    const user = this.userRepository.create({
      ...dto,
      company,
    });

    return this.userRepository.save(user);
  }

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
}
