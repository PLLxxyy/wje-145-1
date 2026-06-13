import { Router, Response } from 'express';
import db from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (_req: AuthRequest, res: Response): void => {
  const groups = db.prepare(`
    SELECT g.*, u.nickname as creator_name, s.title as script_title,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as current_players
    FROM group_invitations g
    JOIN users u ON g.creator_id = u.id
    LEFT JOIN scripts s ON g.script_id = s.id
    WHERE g.status = 'open'
    ORDER BY g.created_at DESC
  `).all();

  res.json({ groups });
});

router.get('/my', authMiddleware, (req: AuthRequest, res: Response): void => {
  const groups = db.prepare(`
    SELECT g.*, u.nickname as creator_name, s.title as script_title,
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as current_players
    FROM group_invitations g
    JOIN users u ON g.creator_id = u.id
    LEFT JOIN scripts s ON g.script_id = s.id
    WHERE g.creator_id = ? OR g.id IN (SELECT group_id FROM group_members WHERE user_id = ?)
    ORDER BY g.created_at DESC
  `).all(req.userId!, req.userId!);

  res.json({ groups });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { script_id, needed_players, date, time_slot, description } = req.body;

  if (!needed_players || !date || !time_slot) {
    res.status(400).json({ error: '请填写需要人数、日期和时段' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO group_invitations (creator_id, script_id, needed_players, date, time_slot, description) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.userId!, script_id || null, needed_players, date, time_slot, description || '');

  const groupId = result.lastInsertRowid;
  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(groupId, req.userId!);

  const group = db.prepare(`
    SELECT g.*, u.nickname as creator_name, s.title as script_title
    FROM group_invitations g
    JOIN users u ON g.creator_id = u.id
    LEFT JOIN scripts s ON g.script_id = s.id
    WHERE g.id = ?
  `).get(groupId);

  res.json({ group });
});

router.post('/:id/join', authMiddleware, (req: AuthRequest, res: Response): void => {
  const group = db.prepare('SELECT * FROM group_invitations WHERE id = ?').get(req.params.id) as any;
  if (!group) {
    res.status(404).json({ error: '组局不存在' });
    return;
  }
  if (group.status !== 'open') {
    res.status(400).json({ error: '该组局已结束' });
    return;
  }

  const existing = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.id, req.userId!);
  if (existing) {
    res.status(400).json({ error: '你已经报名了' });
    return;
  }

  const memberCount = db.prepare('SELECT COUNT(*) as count FROM group_members WHERE group_id = ?').get(req.params.id) as { count: number };
  if (memberCount.count >= group.needed_players) {
    res.status(400).json({ error: '人数已满' });
    return;
  }

  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(req.params.id, req.userId!);

  const newCount = memberCount.count + 1;
  if (newCount >= group.needed_players) {
    db.prepare("UPDATE group_invitations SET status = 'full' WHERE id = ?").run(req.params.id);
  }

  res.json({ message: '报名成功' });
});

export default router;
