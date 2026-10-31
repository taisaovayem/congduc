import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class JoinCoCultivationRoomDto {
  @IsString()
  @Length(4, 16)
  roomCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  password?: string;
}
