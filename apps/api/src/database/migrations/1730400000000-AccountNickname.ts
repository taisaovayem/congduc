import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { generateNickname } from '../../common/utils/code.util';

export class AccountNickname1730400000000 implements MigrationInterface {
  name = 'AccountNickname1730400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasNickname = await queryRunner.hasColumn('accounts', 'nickname');
    if (hasNickname) {
      return;
    }

    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'nickname',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
    );

    const rows: { id: string }[] = await queryRunner.query(`SELECT id FROM accounts`);
    for (const row of rows) {
      await queryRunner.query(`UPDATE accounts SET nickname = $1 WHERE id = $2`, [
        generateNickname(),
        row.id,
      ]);
    }

    await queryRunner.changeColumn(
      'accounts',
      'nickname',
      new TableColumn({
        name: 'nickname',
        type: 'varchar',
        length: '32',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasNickname = await queryRunner.hasColumn('accounts', 'nickname');
    if (!hasNickname) {
      return;
    }
    await queryRunner.dropColumn('accounts', 'nickname');
  }
}
