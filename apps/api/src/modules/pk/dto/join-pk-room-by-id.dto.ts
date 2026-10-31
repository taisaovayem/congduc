import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinPkRoomByIdDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  password?: string;
}
