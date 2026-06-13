import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req: AuthRequest, res: Response): void => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    res.status(400).json({ error: '用户名、密码和昵称不能为空' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(400).json({ error: '用户名已存在' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)').run(username, hash, nickname, 'player');

  const token = generateToken(result.lastInsertRowid as number, 'player');
  res.json({
    token,
    user: { id: result.lastInsertRowid, username, nickname, role: 'player' }
  });
});

router.post('/login', (req: AuthRequest, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = generateToken(user.id, user.role);
  res.json({
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  const user = db.prepare('SELECT id, username, nickname, role FROM users WHERE id = ?').get(req.userId!) as any;
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json({ user });
});

export default router;
