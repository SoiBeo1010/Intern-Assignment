import { FormEvent, useEffect, useMemo, useState } from 'react';

type SubjectScore = {
  subjectCode: string;
  subjectName: string;
  score: number;
};

type ScoreLookupResult = {
  registrationNumber: string;
  foreignLanguageCode: string | null;
  scores: SubjectScore[];
};

type ScoreReportRow = {
  subjectCode: string;
  subjectName: string;
  greaterThanOrEqual8: number;
  from6ToBelow8: number;
  from4ToBelow6: number;
  below4: number;
};

type GroupAStudent = {
  registrationNumber: string;
  totalScore: number;
  scores: SubjectScore[];
};

type ApiError = {
  message: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const menuItems = [
  { label: 'Search Scores', href: '#search' },
  { label: 'Subject Report', href: '#report' },
  { label: 'Top Group A', href: '#top-group-a' },
];

const scoreBands = [
  { key: 'greaterThanOrEqual8', label: '>= 8', color: 'var(--accent-1)' },
  { key: 'from6ToBelow8', label: '6 - 7.99', color: 'var(--accent-2)' },
  { key: 'from4ToBelow6', label: '4 - 5.99', color: 'var(--accent-3)' },
  { key: 'below4', label: '< 4', color: 'var(--accent-4)' },
] as const;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  let data: T | ApiError | null = null;

  if (text.trim()) {
    if (!contentType.includes('application/json')) {
      throw new Error(response.ok ? 'API returned a non-JSON response.' : `Request failed with status ${response.status}.`);
    }

    try {
      data = JSON.parse(text) as T | ApiError;
    } catch {
      throw new Error('API returned an invalid JSON response.');
    }
  }

  if (!response.ok) {
    const message = typeof data === 'object' && data && 'message' in data ? data.message : 'Request failed.';
    throw new Error(message);
  }

  if (data === null) {
    throw new Error('API returned an empty response.');
  }

  return data as T;
}

function formatScore(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '');
}

function formatRegistration(reg: string): string {
  const trimmed = reg.replace(/^0+/, '');
  return trimmed === '' ? reg : trimmed;
}

function App() {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [lookupResult, setLookupResult] = useState<ScoreLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [report, setReport] = useState<ScoreReportRow[]>([]);
  const [topStudents, setTopStudents] = useState<GroupAStudent[]>([]);
  const [panelError, setPanelError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPanels() {
      try {
        const [reportResponse, topStudentsResponse] = await Promise.all([
          fetchJson<{ data: ScoreReportRow[] }>('/api/reports/score-levels'),
          fetchJson<{ data: GroupAStudent[] }>('/api/students/top-group-a?limit=10'),
        ]);

        if (!active) {
          return;
        }

        setReport(reportResponse.data);
        setTopStudents(topStudentsResponse.data);
      } catch (error) {
        if (!active) {
          return;
        }

        setPanelError(error instanceof Error ? error.message : 'Failed to load dashboard data.');
      }
    }

    loadPanels();

    return () => {
      active = false;
    };
  }, []);

  const reportTotals = useMemo(() => {
    return report.reduce(
      (accumulator, item) => ({
        students: accumulator.students + item.greaterThanOrEqual8 + item.from6ToBelow8 + item.from4ToBelow6 + item.below4,
        strong: accumulator.strong + item.greaterThanOrEqual8,
        average: accumulator.average + item.from6ToBelow8,
        low: accumulator.low + item.from4ToBelow6 + item.below4,
      }),
      { students: 0, strong: 0, average: 0, low: 0 },
    );
  }, [report]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = registrationNumber.trim();

    if (!cleaned) {
      setLookupError('Enter a 7- or 8-digit registration number.');
      setLookupResult(null);
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const response = await fetchJson<ScoreLookupResult>(`/api/scores/${encodeURIComponent(cleaned)}`);
      setLookupResult(response);
    } catch (error) {
      setLookupResult(null);
      setLookupError(error instanceof Error ? error.message : 'Unable to search scores.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-background" />

      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-mark">G</div>
          <div>
            <p className="eyebrow">Exam score portal</p>
            <h1>G-Scores</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {menuItems.map(item => (
            <a key={item.href} href={item.href} className="nav-item">
              <span>{item.label}</span>
              <span>→</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className="content">
        <section className="hero-panel">
          <div>
            <p className="eyebrow">Golden Owl internship assignment</p>
            <h2>Intern assignment: G-Scores dashboard</h2>
            <p className="hero-copy">
              Demonstrates the internship deliverables: search scores by registration number, subject-level
              distribution reports, and a top-10 Group A leaderboard — implemented with React Hooks and the
              provided exam-score API.
            </p>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <span>Loaded subjects</span>
              <strong>{report.length || '—'}</strong>
            </div>
            <div className="metric-card">
              <span>Top Group A rows</span>
              <strong>{topStudents.length || '—'}</strong>
            </div>
            <div className="metric-card">
              <span>Score entries</span>
              <strong>{reportTotals.students || '—'}</strong>
            </div>
          </div>
        </section>

        <section id="search" className="panel search-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">User registration</p>
              <h3>Check a candidate score</h3>
            </div>
          </div>

          <form className="search-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Registration number</span>
              <input
                value={registrationNumber}
                onChange={event => setRegistrationNumber(event.target.value)}
                placeholder="Enter registration number"
                inputMode="numeric"
                maxLength={8}
                autoComplete="off"
              />
            </label>
            <button className="primary-button" type="submit" disabled={lookupLoading}>
              {lookupLoading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {lookupError ? <p className="message error">{lookupError}</p> : null}

          {lookupResult ? (
            <div className="result-grid">
                <div className="result-card result-summary">
                <span>Registration number</span>
                <strong>{formatRegistration(lookupResult.registrationNumber)}</strong>
                <p>
                  Foreign language code: <strong>{lookupResult.foreignLanguageCode ?? 'N/A'}</strong>
                </p>
              </div>

              {lookupResult.scores.map(score => (
                <article key={score.subjectCode} className="result-card score-chip">
                  <span>{score.subjectName}</span>
                  <strong>{formatScore(score.score)}</strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h4>Detailed scores will appear here</h4>
              <p>Search any valid registration number to reveal the subject-by-subject result set.</p>
            </div>
          )}
        </section>

        <section id="report" className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Subject report</p>
              <h3>Score distribution by band</h3>
            </div>
            <span className="pill">4 levels per subject</span>
          </div>

          {panelError ? <p className="message error">{panelError}</p> : null}

          <div className="legend-row" aria-label="Score level legend">
            {scoreBands.map(band => (
              <div key={band.key} className="legend-item">
                <span className="legend-swatch" style={{ backgroundColor: band.color }} />
                <span>{band.label}</span>
              </div>
            ))}
          </div>

          <div className="report-grid">
            {report.map(row => {
              const total =
                row.greaterThanOrEqual8 + row.from6ToBelow8 + row.from4ToBelow6 + row.below4 || 1;

              return (
                <article key={row.subjectCode} className="report-row">
                  <header>
                    <div>
                      <h4>{row.subjectName}</h4>
                    </div>
                    <strong>{total}</strong>
                  </header>

                  <div className="stacked-bar" aria-label={`${row.subjectName} score distribution`}>
                    {scoreBands.map(band => {
                      const count = row[band.key];
                      const width = `${(count / total) * 100}%`;

                      return (
                        <span
                          key={band.key}
                          className="stacked-segment"
                          style={{ width, backgroundColor: band.color }}
                          title={`${band.label}: ${count}`}
                        />
                      );
                    })}
                  </div>

                  <div className="band-values">
                    {scoreBands.map(band => (
                      <div key={band.key}>
                        <span>{band.label}</span>
                        <strong>{row[band.key]}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="top-group-a" className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h3>Top 10 Group A students</h3>
            </div>
            <span className="pill">Math + Physics + Chemistry</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Registration</th>
                  <th>Math</th>
                  <th>Physics</th>
                  <th>Chemistry</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map((student, index) => (
                  <tr key={student.registrationNumber}>
                      <td>
                        <span className="rank-badge">{index + 1}</span>
                      </td>
                      <td>{formatRegistration(student.registrationNumber)}</td>
                    {student.scores.map(score => (
                      <td key={score.subjectCode}>{formatScore(score.score)}</td>
                    ))}
                    <td>
                      <strong>{formatScore(student.totalScore)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
