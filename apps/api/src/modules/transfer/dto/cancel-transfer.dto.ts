import { IsString, Length } from 'class-validator';

export class CancelTransferDto {
  @IsString()
  @Length(8, 8)
  transactionCode!: string;

  @IsString()
  @Length(6, 6)
  confirmationCode!: string;
}
