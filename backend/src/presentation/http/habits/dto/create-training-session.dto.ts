import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateTrainingSessionDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  occurred_on!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label?: string;
}
