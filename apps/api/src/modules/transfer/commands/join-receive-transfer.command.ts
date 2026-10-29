export class JoinReceiveTransferCommand {
  constructor(
    public readonly deviceId: string,
    public readonly transactionCode: string,
  ) {}
}
