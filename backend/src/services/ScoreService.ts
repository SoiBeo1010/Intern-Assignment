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
  subjectCode: string;
  score: string;
}

interface RawReportRow {
  subjectCode: string;
  greaterThanOrEqual8: string;
  from6ToBelow8: string;
  from4ToBelow6: string;
  below4: string;
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
    const rows = await this.dataSource
      .getRepository(Score)
      .createQueryBuilder('score')
      .innerJoin(Student, 'student', 'student.registrationNumber = score.registrationNumber')
      .select('student.registrationNumber', 'registrationNumber')
      .addSelect('student.foreignLanguageCode', 'foreignLanguageCode')
      .addSelect('score.subjectCode', 'subjectCode')
      .addSelect('score.score', 'score')
      .where('student.registrationNumber = :registrationNumber', { registrationNumber })
      .orderBy('score.subjectCode', 'ASC')
      .getRawMany<RawStudentScoreRow>();

    if (rows.length === 0) {
      return null;
    }

    return {
      registrationNumber: rows[0].registrationNumber,
      foreignLanguageCode: rows[0].foreignLanguageCode,
      scores: rows.map(row => this.toSubjectScore(row.subjectCode, row.score)),
    };
  }

  async getScoreLevelReport(): Promise<ScoreLevelReportItem[]> {
    const rows = await this.dataSource
      .getRepository(Score)
      .createQueryBuilder('score')
      .select('score.subjectCode', 'subjectCode')
      .addSelect('SUM(CASE WHEN score.score >= 8 THEN 1 ELSE 0 END)', 'greaterThanOrEqual8')
      .addSelect('SUM(CASE WHEN score.score < 8 AND score.score >= 6 THEN 1 ELSE 0 END)', 'from6ToBelow8')
      .addSelect('SUM(CASE WHEN score.score < 6 AND score.score >= 4 THEN 1 ELSE 0 END)', 'from4ToBelow6')
      .addSelect('SUM(CASE WHEN score.score < 4 THEN 1 ELSE 0 END)', 'below4')
      .groupBy('score.subjectCode')
      .getRawMany<RawReportRow>();

    const reportBySubject = new Map(rows.map(row => [row.subjectCode, row]));

    return subjectCatalog.all().map(subject => {
      const row = reportBySubject.get(subject.code);

      return {
        subjectCode: subject.code,
        subjectName: subject.name,
        greaterThanOrEqual8: this.toCount(row?.greaterThanOrEqual8),
        from6ToBelow8: this.toCount(row?.from6ToBelow8),
        from4ToBelow6: this.toCount(row?.from4ToBelow6),
        below4: this.toCount(row?.below4),
      };
    });
  }

  async getTopGroupAStudents(limit = 10): Promise<GroupAStudentResult[]> {
    const [math, physics, chemistry] = subjectCatalog.groupA();
    const groupACodes = [math.code, physics.code, chemistry.code];

    const rows = await this.dataSource
      .getRepository(Score)
      .createQueryBuilder('score')
      .select('score.registrationNumber', 'registrationNumber')
      .addSelect(
        'SUM(CASE WHEN score.subjectCode = :mathCode THEN score.score ELSE 0 END)',
        'mathScore',
      )
      .addSelect(
        'SUM(CASE WHEN score.subjectCode = :physicsCode THEN score.score ELSE 0 END)',
        'physicsScore',
      )
      .addSelect(
        'SUM(CASE WHEN score.subjectCode = :chemistryCode THEN score.score ELSE 0 END)',
        'chemistryScore',
      )
      .addSelect('SUM(score.score)', 'totalScore')
      .where('score.subjectCode IN (:...groupACodes)', {
        groupACodes,
        mathCode: math.code,
        physicsCode: physics.code,
        chemistryCode: chemistry.code,
      })
      .groupBy('score.registrationNumber')
      .having('COUNT(DISTINCT score.subjectCode) = :requiredSubjectCount', {
        requiredSubjectCount: groupACodes.length,
      })
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

  private toSubjectScore(
    subjectCode: string,
    rawScore: string,
    subject: SubjectDefinition = subjectCatalog.requireByCode(subjectCode),
  ): SubjectScoreResult {
    return {
      subjectCode,
      subjectName: subject.name,
      score: this.toNumber(rawScore),
    };
  }

  private toCount(value: string | undefined): number {
    return Number(value || 0);
  }

  private toNumber(value: string): number {
    return Number(Number(value).toFixed(2));
  }
}
