import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Student } from './Student';

@Entity({ name: 'scores' })
export class Score {
  @PrimaryColumn({ name: 'registration_number', type: 'varchar', length: 20 })
  registrationNumber!: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  toan!: string | null;

  @Column({ name: 'ngu_van', type: 'decimal', precision: 4, scale: 2, nullable: true })
  nguVan!: string | null;

  @Column({ name: 'ngoai_ngu', type: 'decimal', precision: 4, scale: 2, nullable: true })
  ngoaiNgu!: string | null;

  @Column({ name: 'vat_li', type: 'decimal', precision: 4, scale: 2, nullable: true })
  vatLi!: string | null;

  @Column({ name: 'hoa_hoc', type: 'decimal', precision: 4, scale: 2, nullable: true })
  hoaHoc!: string | null;

  @Column({ name: 'sinh_hoc', type: 'decimal', precision: 4, scale: 2, nullable: true })
  sinhHoc!: string | null;

  @Column({ name: 'lich_su', type: 'decimal', precision: 4, scale: 2, nullable: true })
  lichSu!: string | null;

  @Column({ name: 'dia_li', type: 'decimal', precision: 4, scale: 2, nullable: true })
  diaLi!: string | null;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  gdcd!: string | null;

  @ManyToOne(() => Student, student => student.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registration_number', referencedColumnName: 'registrationNumber' })
  student!: Student;
}
