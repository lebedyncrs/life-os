import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class PatchShoppingItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsBoolean()
  is_done?: boolean;
}
