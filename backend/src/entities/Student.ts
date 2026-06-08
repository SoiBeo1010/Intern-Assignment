import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Score } from './Score';

@Entity({ name: 'students' })
export class Student {
  @PrimaryColumn({ name: 'registration_number', type: 'varchar', length: 20 })
  registrationNumber!: string;

  @Column({ name: 'foreign_language_code', type: 'varchar', length: 10, nullable: true })
  foreignLanguageCode!: string | null;

  @OneToMany(() => Score, score => score.student)
  scores!: Score[];
}
