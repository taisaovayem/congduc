import { IsIn, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';

export class CreateSendTransferDto {
  @IsOptional()
  @IsIn(['all'])
  mode?: 'all';

  @ValidateIf((o: CreateSendTransferDto) => o.mode !== 'all')
  @IsNumber()
  @Min(1)
  amount?: number;
}
