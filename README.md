# G-Scores

G-Scores is a full-stack web application for exploring Vietnam's 2024 THPT national exam scores. It imports the raw CSV dataset into MySQL, exposes a TypeScript backend API, and provides a React dashboard for candidate lookup, subject distribution reports, and Group A ranking.

## Features

- Import `dataset/diem_thi_thpt_2024.csv` into MySQL through coded TypeORM migrations and a seeder.
- Search candidate scores by registration number.
- Support 7-digit lookup input by normalizing it to the stored 8-digit registration number format.
- Show score-level statistics by subject across four bands: `>= 8`, `6 - 7.99`, `4 - 5.99`, and `< 4`.
- List the top 10 Group A students by Math, Physics, and Chemistry total score.
- Run the database, backend, and frontend together with Docker Compose.

## Tech Stack

- Frontend: React, Vite, TypeScript, CSS
- Backend: Node.js, Express, TypeScript
- ORM: TypeORM
- Database: MySQL
- Tooling: Docker Compose

## Project Structure

```text
.
├── backend/
│   ├── src/db/migrations/       # TypeORM schema migrations
│   ├── src/db/seeders/          # CSV import seeder
│   ├── src/domain/subjects/     # Subject management domain logic
│   ├── src/entities/            # TypeORM entities
│   ├── src/routes/              # Express API routes
│   └── src/services/            # Backend business logic
├── dataset/
│   └── diem_thi_thpt_2024.csv
├── frontend/
│   └── src/
└── docker-compose.yml
```

## Prerequisites

- Node.js 20 or newer
- npm
- Docker Desktop, if running with Docker

## Run With Docker

From the project root:

```bash
docker compose up --build
```

Services:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000
MySQL:    localhost:3307
```

The frontend service proxies `/api` requests to the backend service inside Docker.

### Import The Dataset

After the database is running, execute the seeder:

```bash
docker compose exec backend npm run seed:csv
```

The seeder reads `/dataset/diem_thi_thpt_2024.csv` inside Docker. The dataset folder is mounted read-only into the backend container.

If you are starting from a fresh database, run the migration once before seeding or using the API:

```bash
docker compose exec backend npm run migration:run
docker compose exec backend npm run seed:csv
```

## Run Locally

Start only MySQL with Docker:

```bash
docker compose up -d db
```

Install backend dependencies and prepare the database:

```bash
cd backend
npm install
npm run migration:run
npm run seed:csv
npm run start
```

In another terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deployment

This project is deployed as three separate services:

### Backend on Render

- Root directory: `backend`
- Build command: `npm run build`
- Start command: `npm run start:prod`
- Environment variables:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `PORT`

Recommended setup:

1. Create a MySQL database on Railway.
2. Copy the Railway connection details into the Render backend environment variables.
3. Deploy the backend from the `backend/` folder.
4. Run the migration and seeder once against the deployed Railway database:
   ```bash
   npm run migration:run
   npm run seed:csv
   ```

The backend already enables CORS, so the Vercel frontend can call it directly.

### Frontend on Vercel

- Root directory: `frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_BASE_URL`

Set `VITE_API_BASE_URL` to the Render backend URL before deploying, for example:

```text
https://your-backend.onrender.com
```

### Database on Railway

- Create a Railway MySQL service.
- Use the Railway host, port, user, password, and database name in the Render backend environment.
- Keep the Railway volume persistent so the imported exam data remains available.

## Database Notes

The backend uses these default local database settings:

```text
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=gscores
DB_PASSWORD=secret
DB_NAME=gscores_db
```

Inside Docker Compose, the backend connects to the database service with:

```text
DB_HOST=db
DB_PORT=3306
```

For Render + Railway deployments, replace those values with the Railway MySQL credentials.

To import a different CSV file locally:

```bash
CSV_PATH=../dataset/diem_thi_thpt_2024.csv npm run seed:csv
```

On Windows PowerShell:

```powershell
$env:CSV_PATH="../dataset/diem_thi_thpt_2024.csv"
npm run seed:csv
```

## Backend API

Base URL:

```text
http://localhost:4000/api
```

For production, use the Render backend base URL instead of `localhost`.

Endpoints:

```text
GET /health
GET /scores/:registrationNumber
GET /reports/score-levels
GET /students/top-group-a?limit=10
```

Examples:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/scores/01000010
curl http://localhost:4000/api/scores/1000010
curl http://localhost:4000/api/reports/score-levels
curl "http://localhost:4000/api/students/top-group-a?limit=10"
```

## Useful Commands

Backend:

```bash
cd backend
npm run build
npm run start:prod
npm run migration:run
npm run migration:revert
npm run seed:csv
npm run db:setup
```

Frontend:

```bash
cd frontend
npm run build
npm run dev
npm run preview
```

Docker:

```bash
docker compose up --build
docker compose up -d db
docker compose down
```

Do not run `docker compose down -v` unless you intentionally want to delete the MySQL volume and imported data.

## Implementation Highlights

- Subject metadata and Group A subject management are centralized in `backend/src/domain/subjects/SubjectCatalog.ts`.
- The raw CSV import is implemented in `backend/src/db/seeders/import_csv.ts`.
- The database schema is managed through TypeORM migrations in `backend/src/db/migrations`.
- Candidate lookup, score-level reports, and Group A ranking are implemented in `backend/src/services/ScoreService.ts`.

## License

This project was built for the Golden Owl Full-stack JS Intern assignment.
