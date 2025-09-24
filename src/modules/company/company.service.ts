import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import {
  CreateCompanyDto,
  CreateCompanyPayload,
} from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UserService } from '../user/user.service';
import { UserRole } from 'src/enums/user-role.enum';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async findAll(): Promise<Company[]> {
    return await this.companyRepository.find({
      where: { isDeleted: false },
      relations: ['users'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!company) {
      throw new NotFoundException(`Company with id ${id} not found`);
    }
    return company;
  }

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const { adminPassword, ...rest } = createCompanyDto;
    const existingByName = await this.companyRepository.findOne({
      where: { name: rest.name },
    });

    if (existingByName) {
      throw new BadRequestException(
        `Company with name '${rest.name}' already exists`,
      );
    }

    if (rest.email) {
      const existingByEmail = await this.companyRepository.findOne({
        where: { email: rest.email },
      });

      if (existingByEmail) {
        throw new BadRequestException(
          `Company with email '${rest.email}' already exists`,
        );
      }
    }

    const company = this.companyRepository.create(rest);
    const result = await this.companyRepository.save(company);

    // Create company admin user
    const userPayload = {
      email: rest.email,
      role: UserRole.COMPANY_ADMIN,
      password: adminPassword,
      companyId: result.id,
    };
    await this.userService.createAdmin(userPayload);

    return result;
  }

  async createCompanyOnly(companyData: CreateCompanyPayload): Promise<Company> {
    const existing = await this.companyRepository.findOne({
      where: [{ name: companyData.name }],
    });

    if (existing) {
      throw new BadRequestException('Company with given name already exists');
    }

    const company = this.companyRepository.create(companyData);
    return this.companyRepository.save(company);
  }

  async findByName(name: string): Promise<Company | null> {
    return await this.companyRepository.findOne({
      where: { name },
    });
  }

  async getDropdownList(): Promise<{ id: string; name: string }[]> {
    return await this.companyRepository.find({
      where: { isDeleted: false },
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(id);

    // Check if name is being updated and if it already exists
    if (updateCompanyDto.name && updateCompanyDto.name !== company.name) {
      const existingByName = await this.companyRepository.findOne({
        where: { name: updateCompanyDto.name, isDeleted: false },
      });

      if (existingByName) {
        throw new BadRequestException(
          `Company with name '${updateCompanyDto.name}' already exists`,
        );
      }
    }

    // Check if email is being updated and if it already exists
    if (updateCompanyDto.email && updateCompanyDto.email !== company.email) {
      const existingByEmail = await this.companyRepository.findOne({
        where: { email: updateCompanyDto.email, isDeleted: false },
      });

      if (existingByEmail) {
        throw new BadRequestException(
          `Company with email '${updateCompanyDto.email}' already exists`,
        );
      }
    }

    Object.assign(company, updateCompanyDto);
    return this.companyRepository.save(company);
  }

  async softDelete(id: string): Promise<void> {
    const company = await this.findOne(id);

    await this.companyRepository.update(id, {
      isDeleted: true,
    });
  }
}
