import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateExamScoreTables1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'students',
        columns: [
          {
            name: 'registration_number',
            type: 'varchar',
            length: '20',
            isPrimary: true,
          },
          {
            name: 'foreign_language_code',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'subjects',
        columns: [
          {
            name: 'code',
            type: 'varchar',
            length: '30',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'scores',
        columns: [
          {
            name: 'registration_number',
            type: 'varchar',
            length: '20',
            isPrimary: true,
          },
          {
            name: 'subject_code',
            type: 'varchar',
            length: '30',
            isPrimary: true,
          },
          {
            name: 'score',
            type: 'decimal',
            precision: 4,
            scale: 2,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('scores', [
      new TableForeignKey({
        columnNames: ['registration_number'],
        referencedTableName: 'students',
        referencedColumnNames: ['registration_number'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['subject_code'],
        referencedTableName: 'subjects',
        referencedColumnNames: ['code'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'scores',
      new TableIndex({
        name: 'IDX_scores_subject_code_score',
        columnNames: ['subject_code', 'score'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scores', true);
    await queryRunner.dropTable('subjects', true);
    await queryRunner.dropTable('students', true);
  }
}
