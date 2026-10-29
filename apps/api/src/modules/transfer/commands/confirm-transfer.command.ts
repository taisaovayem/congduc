export class ConfirmTransferCommand {
  constructor(
    public readonly deviceId: string,
    public readonly transactionCode: string,
    public readonly confirmationCode: string,
    public readonly role: 'sender' | 'receiver',
  ) {}
}
