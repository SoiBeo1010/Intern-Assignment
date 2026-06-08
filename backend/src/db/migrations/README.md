# Migrations

Database migrations live here. The assignment's coded CSV conversion is implemented with TypeORM and MySQL.

Current structure:
- `1710000000000-CreateExamScoreTables.ts` creates `students`, `subjects`, and `scores`.
- `1710000000001-AddGroupAQueryIndex.ts` adds an index for the Group A top-students query.
- `../seeders/import_csv.ts` streams `dataset/diem_thi_thpt_2024.csv` into those tables.

Start the project MySQL database from the repository root:

```bash
docker compose up -d db
```

Then run from `backend`:

```bash
npm run migration:run
npm run seed:csv
```

By default, host commands connect to `127.0.0.1:3307`. The backend container still connects to `db:3306`.
