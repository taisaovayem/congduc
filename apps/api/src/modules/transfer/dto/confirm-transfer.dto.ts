import { IsIn, IsString, Length } from 'class-validator';

export class ConfirmTransferDto {
  @IsString()
  @Length(8, 8)
  transactionCode!: string;

  @IsString()
  @Length(6, 6)
  confirmationCode!: string;

  @IsIn(['sender', 'receiver'])
  role!: 'sender' | 'receiver';
}
