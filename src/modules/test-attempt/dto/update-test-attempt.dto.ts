import { PartialType } from '@nestjs/swagger';
import { CreateTestAttemptDto } from './create-test-attempt.dto';

export class UpdateTestAttemptDto extends PartialType(CreateTestAttemptDto) {}
