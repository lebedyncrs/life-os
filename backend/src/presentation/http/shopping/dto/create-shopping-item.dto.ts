import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateShoppingItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title!: string;
}
