import { Router, Response } from 'express';
import db from '../db/database';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (_req: AuthRequest, res: Response): void => {
  const rooms = db.prepare('SELECT * FROM rooms ORDER BY id').all();
  res.json({ rooms });
});

router.get('/:id', (req: AuthRequest, res: Response): void => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) {
    res.status(404).json({ error: '房间不存在' });
    return;
  }
  res.json({ room });
});

router.post('/', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const { name, capacity, duration, price, status, description } = req.body;

  if (!name || !capacity || !duration || price === undefined) {
    res.status(400).json({ error: '请填写完整房间信息' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO rooms (name, capacity, duration, price, status, description) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, capacity, duration, price, status || 'available', description || '');

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid);
  res.json({ room });
});

router.put('/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const { name, capacity, duration, price, status, description } = req.body;

  const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: '房间不存在' });
    return;
  }

  db.prepare(
    'UPDATE rooms SET name=?, capacity=?, duration=?, price=?, status=?, description=? WHERE id=?'
  ).run(
    name || (existing as any).name,
    capacity || (existing as any).capacity,
    duration || (existing as any).duration,
    price !== undefined ? price : (existing as any).price,
    status || (existing as any).status,
    description !== undefined ? description : (existing as any).description,
    req.params.id
  );

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  res.json({ room });
});

export default router;
