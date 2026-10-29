import { IsOptional, IsUUID } from 'class-validator';

export class EnsureSessionDto {
  @IsOptional()
  @IsUUID()
  deviceId?: string;
}
