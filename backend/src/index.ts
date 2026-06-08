import express from 'express';
import AppDataSource from './data-source';
import { createApiRouter } from './routes';

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'G-Scores backend API' });
});

app.use('/api', createApiRouter(AppDataSource));

const PORT = process.env.PORT || 4000;

AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(error => {
    console.error('Failed to initialize database connection:', error);
    process.exitCode = 1;
  });
