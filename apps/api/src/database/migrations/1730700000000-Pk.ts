import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class Pk1730700000000 implements MigrationInterface {
  name = 'Pk1730700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('pk_rooms')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'pk_rooms',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'room_code', type: 'varchar', length: '16', isNullable: false },
          { name: 'name', type: 'varchar', length: '64', isNullable: false },
          { name: 'password_hash', type: 'varchar', length: '128', isNullable: true },
          { name: 'host_account_id', type: 'uuid', isNullable: false },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'", isNullable: false },
          { name: 'team_size', type: 'int', default: 1, isNullable: false },
          { name: 'mode', type: 'varchar', length: '24', default: "'friendly'", isNullable: false },
          { name: 'stake_amount', type: 'bigint', isNullable: true },
          { name: 'duration_minutes', type: 'int', default: 1, isNullable: false },
          { name: 'match_started_at', type: 'timestamptz', isNullable: true },
          { name: 'match_ends_at', type: 'timestamptz', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_pk_rooms_room_code',
            columnNames: ['room_code'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'pk_room_members',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'room_id', type: 'uuid', isNullable: false },
          { name: 'account_id', type: 'uuid', isNullable: false },
          { name: 'team', type: 'varchar', length: '8', isNullable: true },
          { name: 'is_spectator', type: 'boolean', default: false, isNullable: false },
          { name: 'is_fighter', type: 'boolean', default: false, isNullable: false },
          { name: 'is_ready', type: 'boolean', default: false, isNullable: false },
          { name: 'match_merit_hits', type: 'bigint', default: '0', isNullable: false },
          { name: 'joined_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_pk_room_members_room_account',
            columnNames: ['room_id', 'account_id'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'pk_rooms',
      new TableForeignKey({
        name: 'FK_pk_rooms_host',
        columnNames: ['host_account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'pk_room_members',
      new TableForeignKey({
        name: 'FK_pk_room_members_room',
        columnNames: ['room_id'],
        referencedTableName: 'pk_rooms',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'pk_room_members',
      new TableForeignKey({
        name: 'FK_pk_room_members_account',
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'pk_rooms',
      new TableIndex({
        name: 'IDX_pk_rooms_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['pk_room_members', 'pk_rooms']) {
      if (await queryRunner.hasTable(table)) {
        await queryRunner.dropTable(table, true, true, true);
      }
    }
  }
}
