import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinCoCultivationRoomByIdDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  password?: string;
}
