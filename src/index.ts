import express from 'express';
import dotenv from 'dotenv';
import seriesRoutes from './routes/series.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use('/api/series', seriesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Streaming Backend API is running perfectly!');
});

app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`🚀 Server safely running on port ${PORT}`);
});