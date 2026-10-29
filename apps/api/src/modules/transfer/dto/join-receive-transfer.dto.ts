import { IsString, Length } from 'class-validator';

export class JoinReceiveTransferDto {
  @IsString()
  @Length(8, 8)
  transactionCode!: string;
}
