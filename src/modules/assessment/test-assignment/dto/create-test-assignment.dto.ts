import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class CreateTestAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  testId: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsUUID()
  @IsOptional()
  companyId: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  maxAttempts: number;

  @ApiPropertyOptional()
  @IsOptional()
  dueAt?: Date;
}

export class AssignTestToCompanyDto {
  @ApiProperty()
  @IsUUID()
  testId: string;

  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  dueAt?: Date;
}

export class AssignTestToUserDto {
  @ApiProperty()
  @IsUUID()
  testId: string;

  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  dueAt?: Date;
}

export class ListTestAssignmentsDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  testId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
export class ListUserTestAssignmentsDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  userAssignmentId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  testId?: string;
}
