export class CreateSendTransferCommand {
  constructor(
    public readonly deviceId: string,
    public readonly amount: number | 'all',
  ) {}
}
