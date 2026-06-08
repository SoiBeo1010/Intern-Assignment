import express from 'express';

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'G-Scores backend placeholder' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
