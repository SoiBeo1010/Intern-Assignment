import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

const subjectScoreColumns = [
  'toan',
  'ngu_van',
  'ngoai_ngu',
  'vat_li',
  'hoa_hoc',
  'sinh_hoc',
  'lich_su',
  'dia_li',
  'gdcd',
];

function scoreColumn(name: string) {
  return {
    name,
    type: 'decimal',
    precision: 4,
    scale: 2,
    isNullable: true,
  };
}

export class CompactScoresTable1710000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scores', true);

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
          ...subjectScoreColumns.map(scoreColumn),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'scores',
      new TableForeignKey({
        columnNames: ['registration_number'],
        referencedTableName: 'students',
        referencedColumnNames: ['registration_number'],
        onDelete: 'CASCADE',
      }),
    );

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scores', true);

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

    await queryRunner.createIndex(
      'scores',
      new TableIndex({
        name: 'IDX_scores_subject_code_registration_number_score',
        columnNames: ['subject_code', 'registration_number', 'score'],
      }),
    );
  }
}
