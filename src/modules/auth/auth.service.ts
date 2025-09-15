import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CompanyService } from '../company/company.service';
import { JWT_EXPIRY, JWT_SECRET } from 'src/utils/jwt-options';
import { PasswordUtil } from 'src/utils/password.util';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto, SignupResponseDto } from './dto/auth-response.dto';
import { User } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { UserRole } from 'src/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private companyService: CompanyService,
    private jwtService: JwtService,
  ) {}

  async signIn(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;
    const user = await this.usersService.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await PasswordUtil.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company?.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: JWT_SECRET,
      expiresIn: JWT_EXPIRY,
    });

    return {
      accessToken,
      user: this.mapUserToResponse(user),
      company: this.mapCompanyToResponse(user.company),
      expiresIn: JWT_EXPIRY,
    };
  }

  async signup(signupDto: SignupDto): Promise<SignupResponseDto> {
    const { companyName, companyPhone, ...userData } = signupDto;

    const existingUser = await this.usersService.findUserByEmail(
      userData.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingCompany = await this.companyService.findByName(companyName);
    if (existingCompany) {
      throw new ConflictException('Company with this name already exists');
    }

    const hashedPassword = await PasswordUtil.hashPassword(userData.password);

    const company = await this.companyService.createCompanyOnly({
      name: companyName,
      phone: companyPhone,
    });

    const user = await this.usersService.create({
      ...userData,
      role: UserRole.COMPANY_ADMIN,
      password: hashedPassword,
      companyId: company.id,
    });

    return {
      user: this.mapUserToResponse(user),
      company: this.mapCompanyToResponse(company),
      message: 'User registered successfully',
    };
  }

  private mapUserToResponse(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private mapCompanyToResponse(company: Company) {
    return {
      id: company.id,
      name: company.name,
      phone: company.phone,
      website: company.website,
      industry: company.industry,
      size: company.size,
      status: company.status,
      createdAt: company.createdAt,
    };
  }
}
