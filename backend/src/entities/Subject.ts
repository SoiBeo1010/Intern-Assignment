import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Score } from './Score';

@Entity({ name: 'subjects' })
export class Subject {
  @PrimaryColumn({ type: 'varchar', length: 30 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @OneToMany(() => Score, score => score.subject)
  scores!: Score[];
}
