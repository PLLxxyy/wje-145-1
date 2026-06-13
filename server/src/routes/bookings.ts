import { Router, Response } from 'express';
import db from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const bookings = db.prepare(`
    SELECT b.*, r.name as room_name, s.title as script_title
    FROM bookings b
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN scripts s ON b.script_id = s.id
    WHERE b.user_id = ?
    ORDER BY b.date DESC, b.time_slot ASC
  `).all(req.userId!);
  res.json({ bookings });
});

router.get('/admin', authMiddleware, (req: AuthRequest, res: Response): void => {
  if (req.userRole !== 'admin') {
    res.status(403).json({ error: '需要管理员权限' });
    return;
  }

  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const bookings = db.prepare(`
    SELECT b.*, r.name as room_name, s.title as script_title, u.nickname as user_nickname
    FROM bookings b
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN scripts s ON b.script_id = s.id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.date = ? AND b.status = 'confirmed'
    ORDER BY b.time_slot ASC
  `).all(date);

  const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms WHERE status = ?').get('available') as { count: number };
  const bookedRoomIds = db.prepare('SELECT DISTINCT room_id FROM bookings WHERE date = ? AND status = ?').all(date, 'confirmed') as { room_id: number }[];

  const roomUsage = db.prepare('SELECT id, name FROM rooms WHERE status = ?').all('available') as { id: number; name: string }[];
  const bookedSet = new Set(bookedRoomIds.map(r => r.room_id));
  const usageRate = totalRooms.count > 0 ? ((bookedSet.size / totalRooms.count) * 100).toFixed(1) : '0';

  res.json({
    bookings,
    date,
    total_rooms: totalRooms.count,
    booked_rooms: bookedSet.size,
    usage_rate: usageRate,
    room_usage: roomUsage.map(r => ({
      ...r,
      is_booked: bookedSet.has(r.id),
    })),
  });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { room_id, script_id, date, time_slot } = req.body;

  if (!room_id || !date || !time_slot) {
    res.status(400).json({ error: '请选择房间、日期和时段' });
    return;
  }

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id) as any;
  if (!room) {
    res.status(404).json({ error: '房间不存在' });
    return;
  }
  if (room.status === 'maintenance') {
    res.status(400).json({ error: '该房间正在维护中' });
    return;
  }

  const conflict = db.prepare(
    "SELECT id FROM bookings WHERE room_id = ? AND date = ? AND time_slot = ? AND status = 'confirmed'"
  ).get(room_id, date, time_slot);

  if (conflict) {
    res.status(400).json({ error: '该时段已被预约' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO bookings (user_id, room_id, script_id, date, time_slot) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId!, room_id, script_id || null, date, time_slot);

  const booking = db.prepare(`
    SELECT b.*, r.name as room_name, s.title as script_title
    FROM bookings b
    LEFT JOIN rooms r ON b.room_id = r.id
    LEFT JOIN scripts s ON b.script_id = s.id
    WHERE b.id = ?
  `).get(result.lastInsertRowid);

  res.json({ booking });
});

router.put('/:id/cancel', authMiddleware, (req: AuthRequest, res: Response): void => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!) as any;
  if (!booking) {
    res.status(404).json({ error: '预约不存在' });
    return;
  }

  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ message: '预约已取消' });
});

export default router;
