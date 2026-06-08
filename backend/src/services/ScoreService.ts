import { DataSource } from 'typeorm';
import { Score } from '../entities/Score';
import { Student } from '../entities/Student';
import { subjectCatalog, SubjectDefinition } from '../domain/subjects/SubjectCatalog';

export interface SubjectScoreResult {
  subjectCode: string;
  subjectName: string;
  score: number;
}

export interface StudentScoreResult {
  registrationNumber: string;
  foreignLanguageCode: string | null;
  scores: SubjectScoreResult[];
}

export interface ScoreLevelReportItem {
  subjectCode: string;
  subjectName: string;
  greaterThanOrEqual8: number;
  from6ToBelow8: number;
  from4ToBelow6: number;
  below4: number;
}

export interface GroupAStudentResult {
  registrationNumber: string;
  totalScore: number;
  scores: SubjectScoreResult[];
}

interface RawStudentScoreRow {
  registrationNumber: string;
  foreignLanguageCode: string | null;
  toan: string | null;
  nguVan: string | null;
  ngoaiNgu: string | null;
  vatLi: string | null;
  hoaHoc: string | null;
  sinhHoc: string | null;
  lichSu: string | null;
  diaLi: string | null;
  gdcd: string | null;
}

interface RawReportRow {
  [key: string]: string | undefined;
}

interface RawGroupARow {
  registrationNumber: string;
  mathScore: string;
  physicsScore: string;
  chemistryScore: string;
  totalScore: string;
}

export class ScoreService {
  constructor(private readonly dataSource: DataSource) {}

  async findByRegistrationNumber(registrationNumber: string): Promise<StudentScoreResult | null> {
    const row = await this.dataSource
      .getRepository(Score)
      .createQueryBuilder('score')
      .innerJoin(Student, 'student', 'student.registrationNumber = score.registrationNumber')
      .select('student.registrationNumber', 'registrationNumber')
      .addSelect('student.foreignLanguageCode', 'foreignLanguageCode')
      .addSelect('score.toan', 'toan')
      .addSelect('score.nguVan', 'nguVan')
      .addSelect('score.ngoaiNgu', 'ngoaiNgu')
      .addSelect('score.vatLi', 'vatLi')
      .addSelect('score.hoaHoc', 'hoaHoc')
      .addSelect('score.sinhHoc', 'sinhHoc')
      .addSelect('score.lichSu', 'lichSu')
      .addSelect('score.diaLi', 'diaLi')
      .addSelect('score.gdcd', 'gdcd')
      .where('student.registrationNumber = :registrationNumber', { registrationNumber })
      .getRawOne<RawStudentScoreRow>();

    if (!row) {
      return null;
    }

    return {
      registrationNumber: row.registrationNumber,
      foreignLanguageCode: row.foreignLanguageCode,
      scores: this.toSubjectScores(row),
    };
  }

  async getScoreLevelReport(): Promise<ScoreLevelReportItem[]> {
    const rows = await this.dataSource
      .getRepository(Score)
      .createQueryBuilder('score')
      .select(
        subjectCatalog.all().flatMap(subject => [
          `SUM(CASE WHEN score.${subject.csvColumn} >= 8 THEN 1 ELSE 0 END) AS ${subject.code}_greaterThanOrEqual8`,
          `SUM(CASE WHEN score.${subject.csvColumn} < 8 AND score.${subject.csvColumn} >= 6 THEN 1 ELSE 0 END) AS ${subject.code}_from6ToBelow8`,
          `SUM(CASE WHEN score.${subject.csvColumn} < 6 AND score.${subject.csvColumn} >= 4 THEN 1 ELSE 0 END) AS ${subject.code}_from4ToBelow6`,
          `SUM(CASE WHEN score.${subject.csvColumn} < 4 THEN 1 ELSE 0 END) AS ${subject.code}_below4`,
        ]),
      )
      .getRawMany<RawReportRow>();

    const row = rows[0];

    return subjectCatalog.all().map(subject => {
      return {
        subjectCode: subject.code,
        subjectName: subject.name,
        greaterThanOrEqual8: this.toCount(row?.[`${subject.code}_greaterThanOrEqual8`]),
        from6ToBelow8: this.toCount(row?.[`${subject.code}_from6ToBelow8`]),
        from4ToBelow6: this.toCount(row?.[`${subject.code}_from4ToBelow6`]),
        below4: this.toCount(row?.[`${subject.code}_below4`]),
      };
    });
  }

  async getTopGroupAStudents(limit = 10): Promise<GroupAStudentResult[]> {
    const [math, physics, chemistry] = subjectCatalog.groupA();

    const rows = await this.dataSource
      .getRepository(Score)
      .createQueryBuilder('score')
      .select('score.registrationNumber', 'registrationNumber')
      .addSelect('score.toan', 'mathScore')
      .addSelect('score.vatLi', 'physicsScore')
      .addSelect('score.hoaHoc', 'chemistryScore')
      .addSelect('(score.toan + score.vatLi + score.hoaHoc)', 'totalScore')
      .where('score.toan IS NOT NULL')
      .andWhere('score.vatLi IS NOT NULL')
      .andWhere('score.hoaHoc IS NOT NULL')
      .orderBy('totalScore', 'DESC')
      .addOrderBy('score.registrationNumber', 'ASC')
      .limit(limit)
      .getRawMany<RawGroupARow>();

    return rows.map(row => ({
      registrationNumber: row.registrationNumber,
      totalScore: this.toNumber(row.totalScore),
      scores: [
        this.toSubjectScore(math.code, row.mathScore, math),
        this.toSubjectScore(physics.code, row.physicsScore, physics),
        this.toSubjectScore(chemistry.code, row.chemistryScore, chemistry),
      ],
    }));
  }

  private toSubjectScores(row: RawStudentScoreRow): SubjectScoreResult[] {
    return subjectCatalog
      .all()
      .map(subject => {
        const rawScore = row[this.toScoreProperty(subject.code)];
        return rawScore === null ? null : this.toSubjectScore(subject.code, rawScore, subject);
      })
      .filter((score): score is SubjectScoreResult => score !== null);
  }

  private toSubjectScore(
    subjectCode: string,
    rawScore: string | null,
    subject: SubjectDefinition = subjectCatalog.requireByCode(subjectCode),
  ): SubjectScoreResult {
    return {
      subjectCode,
      subjectName: subject.name,
      score: this.toNumber(rawScore || '0'),
    };
  }

  private toCount(value: string | undefined): number {
    return Number(value || 0);
  }

  private toNumber(value: string): number {
    return Number(Number(value).toFixed(2));
  }

  private toScoreProperty(subjectCode: string): keyof RawStudentScoreRow {
    const propertyBySubjectCode: Record<string, keyof RawStudentScoreRow> = {
      toan: 'toan',
      ngu_van: 'nguVan',
      ngoai_ngu: 'ngoaiNgu',
      vat_li: 'vatLi',
      hoa_hoc: 'hoaHoc',
      sinh_hoc: 'sinhHoc',
      lich_su: 'lichSu',
      dia_li: 'diaLi',
      gdcd: 'gdcd',
    };

    const property = propertyBySubjectCode[subjectCode];
    if (!property) {
      throw new Error(`Unknown subject code: ${subjectCode}`);
    }

    return property;
  }
}
