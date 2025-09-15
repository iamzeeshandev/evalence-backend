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
    return await this.companyRepository.find();
  }
  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with id ${id} not found`);
    }
    return company;
  }

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const { email, adminPassword, ...rest } = createCompanyDto;
    const existing = await this.companyRepository.findOne({
      where: [{ name: rest.name }],
    });

    if (existing) {
      throw new BadRequestException('Company with given name already exists');
    }

    const company = this.companyRepository.create(rest);
    const result = await this.companyRepository.save(company);

    // Create company admin user
    const userPayload = {
      email,
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
}
