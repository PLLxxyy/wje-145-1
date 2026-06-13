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

router.get('/:id/bookings', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) {
    res.status(404).json({ error: '房间不存在' });
    return;
  }

  const bookings = db.prepare(`
    SELECT b.*, r.name as room_name, s.title as script_title, u.nickname as user_nickname
    FROM bookings b
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN scripts s ON b.script_id = s.id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.room_id = ? AND b.status = 'confirmed'
    ORDER BY b.date ASC, b.time_slot ASC
  `).all(req.params.id);

  res.json({ bookings });
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
  const { name, capacity, duration, price, status, description, cancel_booking_ids } = req.body;

  const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id) as any;
  if (!existing) {
    res.status(404).json({ error: '房间不存在' });
    return;
  }

  const newStatus = status || existing.status;
  let cancelledCount = 0;
  let cancelledBookings: any[] = [];

  if (newStatus === 'maintenance' && existing.status !== 'maintenance') {
    const currentBookings = db.prepare(`
      SELECT b.*, r.name as room_name, s.title as script_title, u.nickname as user_nickname
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN scripts s ON b.script_id = s.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.room_id = ? AND b.status = 'confirmed'
      ORDER BY b.date ASC, b.time_slot ASC
    `).all(req.params.id) as any[];

    if (cancel_booking_ids && Array.isArray(cancel_booking_ids) && cancel_booking_ids.length > 0) {
      const currentIds = new Set(currentBookings.map(b => b.id));
      const requestedIds = cancel_booking_ids.map(Number).filter(id => currentIds.has(id));

      if (requestedIds.length !== cancel_booking_ids.length) {
        res.status(409).json({
          error: '预约信息已发生变化，请重新核对',
          current_bookings: currentBookings,
        });
        return;
      }

      if (requestedIds.length > 0) {
        const placeholders = requestedIds.map(() => '?').join(',');
        const updateStmt = db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id IN (${placeholders})`);
        const info = updateStmt.run(...requestedIds);
        cancelledCount = info.changes;

        cancelledBookings = currentBookings.filter(b => requestedIds.includes(b.id));
      }
    } else if (currentBookings.length > 0) {
      res.status(400).json({ error: '请提供要取消的预约 ID 列表' });
      return;
    }
  }

  db.prepare(
    'UPDATE rooms SET name=?, capacity=?, duration=?, price=?, status=?, description=? WHERE id=?'
  ).run(
    name || existing.name,
    capacity || existing.capacity,
    duration || existing.duration,
    price !== undefined ? price : existing.price,
    newStatus,
    description !== undefined ? description : existing.description,
    req.params.id
  );

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  res.json({ room, cancelled_count: cancelledCount, cancelled_bookings: cancelledBookings });
});

export default router;
