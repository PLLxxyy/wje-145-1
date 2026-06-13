import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import scriptRoutes from './routes/scripts';
import bookingRoutes from './routes/bookings';
import groupRoutes from './routes/groups';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/bookings', authMiddleware, bookingRoutes);
app.use('/api/groups', groupRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: '剧本杀桌游店管理系统运行中' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
