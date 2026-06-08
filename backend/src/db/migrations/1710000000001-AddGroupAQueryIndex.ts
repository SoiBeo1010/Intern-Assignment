import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddGroupAQueryIndex1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const scores = await queryRunner.getTable('scores');
    if (!scores?.findColumnByName('subject_code')) {
      return;
    }

    await queryRunner.createIndex(
      'scores',
      new TableIndex({
        name: 'IDX_scores_subject_code_registration_number_score',
        columnNames: ['subject_code', 'registration_number', 'score'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const scores = await queryRunner.getTable('scores');
    if (scores?.indices.some(index => index.name === 'IDX_scores_subject_code_registration_number_score')) {
      await queryRunner.dropIndex('scores', 'IDX_scores_subject_code_registration_number_score');
    }
  }
}
