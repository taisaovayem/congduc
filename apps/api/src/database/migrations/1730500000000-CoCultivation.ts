import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CoCultivation1730500000000 implements MigrationInterface {
  name = 'CoCultivation1730500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('co_cultivation_sessions')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'co_cultivation_sessions',
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
          { name: 'room_name', type: 'varchar', length: '64', isNullable: false },
          { name: 'had_password', type: 'boolean', default: false, isNullable: false },
          { name: 'status', type: 'varchar', length: '16', default: "'open'", isNullable: false },
          { name: 'started_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'ended_at', type: 'timestamptz', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'co_cultivation_session_participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          { name: 'session_id', type: 'uuid', isNullable: false },
          { name: 'account_id', type: 'uuid', isNullable: false },
          { name: 'nickname', type: 'varchar', length: '32', isNullable: false },
          {
            name: 'personal_merit_hits',
            type: 'bigint',
            default: '0',
            isNullable: false,
          },
          {
            name: 'bonus_merit_received',
            type: 'bigint',
            default: '0',
            isNullable: false,
          },
          { name: 'joined_at', type: 'timestamptz', default: 'now()', isNullable: false },
          { name: 'left_at', type: 'timestamptz', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'co_cultivation_rooms',
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
          { name: 'session_id', type: 'uuid', isNullable: false },
          { name: 'status', type: 'varchar', length: '16', default: "'waiting'", isNullable: false },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_co_cultivation_rooms_room_code',
            columnNames: ['room_code'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'co_cultivation_room_members',
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
          { name: 'is_ready', type: 'boolean', default: false, isNullable: false },
          { name: 'is_participating', type: 'boolean', default: false, isNullable: false },
          {
            name: 'personal_merit_hits',
            type: 'bigint',
            default: '0',
            isNullable: false,
          },
          { name: 'joined_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_co_cultivation_room_members_room_account',
            columnNames: ['room_id', 'account_id'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'co_cultivation_session_participants',
      new TableForeignKey({
        name: 'FK_co_cultivation_session_participants_session',
        columnNames: ['session_id'],
        referencedTableName: 'co_cultivation_sessions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'co_cultivation_session_participants',
      new TableForeignKey({
        name: 'FK_co_cultivation_session_participants_account',
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'co_cultivation_rooms',
      new TableForeignKey({
        name: 'FK_co_cultivation_rooms_host',
        columnNames: ['host_account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'co_cultivation_rooms',
      new TableForeignKey({
        name: 'FK_co_cultivation_rooms_session',
        columnNames: ['session_id'],
        referencedTableName: 'co_cultivation_sessions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'co_cultivation_room_members',
      new TableForeignKey({
        name: 'FK_co_cultivation_room_members_room',
        columnNames: ['room_id'],
        referencedTableName: 'co_cultivation_rooms',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'co_cultivation_room_members',
      new TableForeignKey({
        name: 'FK_co_cultivation_room_members_account',
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'co_cultivation_rooms',
      new TableIndex({
        name: 'IDX_co_cultivation_rooms_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'co_cultivation_room_members',
      'co_cultivation_rooms',
      'co_cultivation_session_participants',
      'co_cultivation_sessions',
    ]) {
      if (await queryRunner.hasTable(table)) {
        await queryRunner.dropTable(table, true, true, true);
      }
    }
  }
}
