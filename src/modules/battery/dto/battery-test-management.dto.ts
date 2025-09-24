import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTestsToBatteryDto {
  @ApiProperty({
    type: [String],
    example: ['test-uuid-1', 'test-uuid-2'],
    description: 'Array of test IDs to add to the battery',
  })
  @IsArray()
  @IsUUID(4, { each: true })
  testIds: string[];
}

export class RemoveTestsFromBatteryDto {
  @ApiProperty({
    type: [String],
    example: ['test-uuid-1', 'test-uuid-2'],
    description: 'Array of test IDs to remove from the battery',
  })
  @IsArray()
  @IsUUID(4, { each: true })
  testIds: string[];
}
