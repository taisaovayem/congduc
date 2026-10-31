import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCoCultivationRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  password?: string;
}
