import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PkMode } from '../entities/pk-mode.enum';

export class CreatePkRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  password?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  teamSize?: number;

  @IsOptional()
  @IsEnum(PkMode)
  mode?: PkMode;

  @IsOptional()
  @IsString()
  stakeAmount?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  durationMinutes?: number;
}
