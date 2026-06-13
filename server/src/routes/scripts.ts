import { Router, Response } from 'express';
import db from '../db/database';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (_req: AuthRequest, res: Response): void => {
  const scripts = db.prepare('SELECT * FROM scripts ORDER BY id').all();

  const ratingsStmt = db.prepare(`
    SELECT r.script_id, AVG(r.score) as avg_score, COUNT(r.score) as rating_count
    FROM ratings r GROUP BY r.script_id
  `);
  const ratingsMap = new Map<number, { avg_score: number; rating_count: number }>();
  (ratingsStmt.all() as any[]).forEach((row: any) => {
    ratingsMap.set(row.script_id, { avg_score: row.avg_score, rating_count: row.rating_count });
  });

  const result = (scripts as any[]).map((s: any) => ({
    ...s,
    avg_score: ratingsMap.get(s.id)?.avg_score ?? null,
    rating_count: ratingsMap.get(s.id)?.rating_count ?? 0,
  }));

  res.json({ scripts: result });
});

router.get('/:id', (req: AuthRequest, res: Response): void => {
  const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(req.params.id) as any;
  if (!script) {
    res.status(404).json({ error: '剧本不存在' });
    return;
  }

  const ratings = db.prepare(`
    SELECT r.*, u.nickname FROM ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.script_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  const avgRow = db.prepare('SELECT AVG(score) as avg_score, COUNT(*) as count FROM ratings WHERE script_id = ?').get(req.params.id) as any;

  res.json({
    script,
    ratings,
    avg_score: avgRow?.avg_score ?? null,
    rating_count: avgRow?.count ?? 0,
  });
});

router.post('/', authMiddleware, adminMiddleware, (req: AuthRequest, res: Response): void => {
  const { title, description, difficulty, duration, min_players, max_players } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: '请填写剧本标题和简介' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO scripts (title, description, difficulty, duration, min_players, max_players) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, description, difficulty || 'medium', duration || 150, min_players || 4, max_players || 6);

  const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(result.lastInsertRowid);
  res.json({ script });
});

router.post('/:id/rate', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { score, comment } = req.body;

  if (!score || score < 1 || score > 5) {
    res.status(400).json({ error: '评分必须在1-5之间' });
    return;
  }

  try {
    db.prepare('INSERT INTO ratings (user_id, script_id, score, comment) VALUES (?, ?, ?, ?)').run(req.userId, req.params.id, score, comment || '');
    res.json({ message: '评分成功' });
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      db.prepare('UPDATE ratings SET score=?, comment=? WHERE user_id=? AND script_id=?').run(score, comment || '', req.userId, req.params.id);
      res.json({ message: '评分已更新' });
    } else {
      res.status(500).json({ error: '评分失败' });
    }
  }
});

export default router;
