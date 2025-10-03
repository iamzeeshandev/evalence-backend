import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AssignmentStatus } from '../entities/battery-group-assignment.entity';

export class CreateBatteryAssignmentDto {
  @ApiProperty({ example: 'battery-uuid' })
  @IsNotEmpty()
  @IsUUID(4)
  batteryId: string;

  @ApiProperty({ example: 'group-uuid' })
  @IsNotEmpty()
  @IsUUID(4)
  groupId: string;

  @ApiPropertyOptional({
    enum: AssignmentStatus,
    default: AssignmentStatus.ACTIVE,
  })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'Assignment notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBatteryAssignmentDto {
  @ApiPropertyOptional({
    enum: AssignmentStatus,
  })
  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'Updated assignment notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class GroupAssignmentDto {
  @ApiProperty({ example: 'group-uuid' })
  @IsNotEmpty()
  @IsUUID(4)
  groupId: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'Assignment notes for this group' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AssignBatteryToGroupDto {
  @ApiProperty({ example: 'battery-uuid' })
  @IsNotEmpty()
  @IsUUID(4)
  batteryId: string;

  @ApiProperty({ example: 'group-uuid' })
  @IsNotEmpty()
  @IsUUID(4)
  groupId: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'Assignment notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AssignBatteryToMultipleGroupsDto {
  @ApiProperty({ example: 'battery-uuid' })
  @IsNotEmpty()
  @IsUUID(4)
  batteryId: string;

  @ApiProperty({
    type: [GroupAssignmentDto],
    example: [
      {
        groupId: 'group-uuid-1',
        expiresAt: '2024-12-31T23:59:59.000Z',
        notes: 'Assignment for Group 1',
      },
      {
        groupId: 'group-uuid-2',
        expiresAt: '2024-12-31T23:59:59.000Z',
        notes: 'Assignment for Group 2',
      },
    ],
    description: 'Array of groups to assign the battery to',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupAssignmentDto)
  groups: GroupAssignmentDto[];
}
