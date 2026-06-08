import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Student } from './Student';
import { Subject } from './Subject';

@Entity({ name: 'scores' })
export class Score {
  @PrimaryColumn({ name: 'registration_number', type: 'varchar', length: 20 })
  registrationNumber!: string;

  @PrimaryColumn({ name: 'subject_code', type: 'varchar', length: 30 })
  subjectCode!: string;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  score!: string;

  @ManyToOne(() => Student, student => student.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registration_number', referencedColumnName: 'registrationNumber' })
  student!: Student;

  @ManyToOne(() => Subject, subject => subject.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_code', referencedColumnName: 'code' })
  subject!: Subject;
}
