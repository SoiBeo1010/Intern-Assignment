import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'subjects' })
export class Subject {
  @PrimaryColumn({ type: 'varchar', length: 30 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;
}
