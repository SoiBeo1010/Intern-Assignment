export interface SubjectDefinition {
  code: string;
  name: string;
  csvColumn: string;
}

export class SubjectCatalog {
  private readonly subjects: SubjectDefinition[];

  private readonly byCode: Map<string, SubjectDefinition>;

  constructor(subjects: SubjectDefinition[]) {
    this.subjects = subjects;
    this.byCode = new Map(subjects.map(subject => [subject.code, subject]));
  }

  all(): SubjectDefinition[] {
    return [...this.subjects];
  }

  csvColumns(): string[] {
    return this.subjects.map(subject => subject.csvColumn);
  }

  findByCode(code: string): SubjectDefinition | undefined {
    return this.byCode.get(code);
  }

  requireByCode(code: string): SubjectDefinition {
    const subject = this.findByCode(code);
    if (!subject) {
      throw new Error(`Unknown subject code: ${code}`);
    }

    return subject;
  }

  groupA(): SubjectDefinition[] {
    return ['toan', 'vat_li', 'hoa_hoc'].map(code => this.requireByCode(code));
  }
}

export const subjectCatalog = new SubjectCatalog([
  { code: 'toan', name: 'Math', csvColumn: 'toan' },
  { code: 'ngu_van', name: 'Literature', csvColumn: 'ngu_van' },
  { code: 'ngoai_ngu', name: 'Foreign Language', csvColumn: 'ngoai_ngu' },
  { code: 'vat_li', name: 'Physics', csvColumn: 'vat_li' },
  { code: 'hoa_hoc', name: 'Chemistry', csvColumn: 'hoa_hoc' },
  { code: 'sinh_hoc', name: 'Biology', csvColumn: 'sinh_hoc' },
  { code: 'lich_su', name: 'History', csvColumn: 'lich_su' },
  { code: 'dia_li', name: 'Geography', csvColumn: 'dia_li' },
  { code: 'gdcd', name: 'Civic Education', csvColumn: 'gdcd' },
]);
