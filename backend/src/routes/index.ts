import { NextFunction, Request, Response, Router } from 'express';
import { DataSource } from 'typeorm';
import { ScoreService } from '../services/ScoreService';
import {
  parseLimit,
  parseRegistrationNumber,
  RequestValidationError,
} from '../validation/requestValidation';

export function createApiRouter(dataSource: DataSource): Router {
  const router = Router();
  const scoreService = new ScoreService(dataSource);

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/scores/:registrationNumber', async (req, res, next) => {
    try {
      const registrationNumber = parseRegistrationNumber(req.params.registrationNumber);
      const studentScores = await scoreService.findByRegistrationNumber(registrationNumber);

      if (!studentScores) {
        res.status(404).json({ message: 'Registration number not found.' });
        return;
      }

      res.json(studentScores);
    } catch (error) {
      next(error);
    }
  });

  router.get('/reports/score-levels', async (_req, res, next) => {
    try {
      const report = await scoreService.getScoreLevelReport();
      res.json({ data: report });
    } catch (error) {
      next(error);
    }
  });

  router.get('/students/top-group-a', async (req, res, next) => {
    try {
      const limit = parseLimit(req.query.limit, 10, 100);
      const students = await scoreService.getTopGroupAStudents(limit);
      res.json({ data: students });
    } catch (error) {
      next(error);
    }
  });

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof RequestValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  });

  return router;
}
