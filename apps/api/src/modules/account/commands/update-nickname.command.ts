export class UpdateNicknameCommand {
  constructor(
    public readonly deviceId: string,
    public readonly nickname: string,
  ) {}
}
