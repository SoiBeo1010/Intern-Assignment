import fs from 'fs';
import path from 'path';
import AppDataSource from '../../data-source';
import { subjectCatalog } from '../../domain/subjects/SubjectCatalog';

const csvPath = process.env.CSV_PATH
  ? path.resolve(process.env.CSV_PATH)
  : path.resolve(__dirname, '../../../../dataset/diem_thi_thpt_2024.csv');

const BATCH_SIZE = parseInt(process.env.SEED_BATCH_SIZE || '1000', 10);

type StudentRow = [string, string | null];
type ScoreRow = [string, ...(number | null)[]];

interface ImportCounters {
  lines: number;
  students: number;
  scores: number;
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function buildColumnIndex(headers: string[]): Map<string, number> {
  return new Map(headers.map((header, index) => [header.trim(), index]));
}

function requireColumn(columnIndex: Map<string, number>, column: string): number {
  const index = columnIndex.get(column);
  if (index === undefined) {
    throw new Error(`CSV is missing required column: ${column}`);
  }

  return index;
}

function parseScore(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const score = Number(trimmed);
  if (!Number.isFinite(score)) {
    throw new Error(`Invalid score value: ${value}`);
  }

  return score;
}

async function seedSubjects(): Promise<void> {
  const subjects = subjectCatalog.all();
  const placeholders = subjects.map(() => '(?, ?)').join(', ');
  const parameters = subjects.flatMap(subject => [subject.code, subject.name]);

  await AppDataSource.query(
    `
      INSERT INTO subjects (code, name)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `,
    parameters,
  );
}

async function flushStudents(rows: StudentRow[]): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const placeholders = rows.map(() => '(?, ?)').join(', ');
  const parameters = rows.flat();

  await AppDataSource.query(
    `
      INSERT INTO students (registration_number, foreign_language_code)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE foreign_language_code = VALUES(foreign_language_code)
    `,
    parameters,
  );

  rows.length = 0;
}

async function flushScores(rows: ScoreRow[]): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const subjectColumns = subjectCatalog.csvColumns();
  const columns = ['registration_number', ...subjectColumns];
  const rowPlaceholders = `(${columns.map(() => '?').join(', ')})`;
  const placeholders = rows.map(() => rowPlaceholders).join(', ');
  const updates = subjectColumns.map(column => `${column} = VALUES(${column})`).join(', ');
  const parameters = rows.flat();

  await AppDataSource.query(
    `
      INSERT INTO scores (${columns.join(', ')})
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE ${updates}
    `,
    parameters,
  );

  rows.length = 0;
}

async function importCsv(): Promise<ImportCounters> {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  await AppDataSource.initialize();

  const students: StudentRow[] = [];
  const scores: ScoreRow[] = [];
  const counters: ImportCounters = {
    lines: 0,
    students: 0,
    scores: 0,
  };

  try {
    await seedSubjects();

    let columnIndex: Map<string, number> | null = null;
    let registrationNumberIndex = -1;
    let foreignLanguageCodeIndex = -1;
    const subjectColumns: Array<{ subjectCode: string; index: number }> = [];

    const processLine = async (rawLine: string): Promise<void> => {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

      if (!columnIndex) {
        const headers = splitCsvLine(line);
        columnIndex = buildColumnIndex(headers);
        registrationNumberIndex = requireColumn(columnIndex, 'sbd');
        foreignLanguageCodeIndex = requireColumn(columnIndex, 'ma_ngoai_ngu');

        for (const subject of subjectCatalog.all()) {
          subjectColumns.push({
            subjectCode: subject.code,
            index: requireColumn(columnIndex, subject.csvColumn),
          });
        }

        return;
      }

      if (!line.trim()) {
        return;
      }

      counters.lines += 1;
      const columns = splitCsvLine(line);
      const registrationNumber = columns[registrationNumberIndex]?.trim();

      if (!registrationNumber) {
        throw new Error(`Missing registration number at CSV data line ${counters.lines}`);
      }

      const foreignLanguageCode = columns[foreignLanguageCodeIndex]?.trim() || null;
      students.push([registrationNumber, foreignLanguageCode]);
      counters.students += 1;

      const scoreRow: ScoreRow = [registrationNumber];
      for (const subject of subjectColumns) {
        const score = parseScore(columns[subject.index] || '');
        scoreRow.push(score);

        if (score !== null) {
          counters.scores += 1;
        }
      }
      scores.push(scoreRow);

      if (students.length >= BATCH_SIZE) {
        await flushStudents(students);
      }

      if (scores.length >= BATCH_SIZE) {
        await flushStudents(students);
        await flushScores(scores);
      }
    };

    const stream = fs.createReadStream(csvPath, { encoding: 'utf8' });
    let buffer = '';

    for await (const chunk of stream) {
      buffer += String(chunk);
      let newlineIndex = buffer.indexOf('\n');

      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        await processLine(line);
        newlineIndex = buffer.indexOf('\n');
      }
    }

    if (buffer.length > 0) {
      await processLine(buffer);
    }

    await flushStudents(students);
    await flushScores(scores);
    return counters;
  } finally {
    await AppDataSource.destroy();
  }
}

importCsv()
  .then(counters => {
    console.log(
      `Imported ${counters.students} students and ${counters.scores} scores from ${counters.lines} CSV rows.`,
    );
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
