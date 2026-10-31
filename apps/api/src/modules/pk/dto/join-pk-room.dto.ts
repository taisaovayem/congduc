import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinPkRoomDto {
  @IsString()
  @MaxLength(16)
  roomCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  password?: string;
}
