import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateIdeaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
