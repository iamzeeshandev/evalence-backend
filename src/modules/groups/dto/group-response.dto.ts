import { ApiProperty } from '@nestjs/swagger';
import { GroupUser } from '../entities/group-user.entity';
import { Company } from '../../company/entities/company.entity';

export class GroupUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  phone?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  lastLoginAt?: Date;
}

export class CompanyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  phone?: string;

  @ApiProperty()
  address?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  state?: string;

  @ApiProperty()
  country?: string;

  @ApiProperty()
  postalCode?: string;

  @ApiProperty()
  website?: string;

  @ApiProperty()
  industry?: string;

  @ApiProperty()
  size?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [GroupUserDto] })
  users: GroupUserDto[];

  @ApiProperty({ type: CompanyDto, required: false })
  company?: CompanyDto;
}
