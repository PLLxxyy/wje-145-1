import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '..', 'data.db');

const db: SqliteDatabase = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('admin','player')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','maintenance')),
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
      duration INTEGER NOT NULL,
      min_players INTEGER NOT NULL,
      max_players INTEGER NOT NULL,
      cover_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      script_id INTEGER,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id),
      FOREIGN KEY (script_id) REFERENCES scripts(id)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      script_id INTEGER NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      comment TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (script_id) REFERENCES scripts(id),
      UNIQUE(user_id, script_id)
    );

    CREATE TABLE IF NOT EXISTS group_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      script_id INTEGER,
      needed_players INTEGER NOT NULL,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','full','closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (script_id) REFERENCES scripts(id)
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES group_invitations(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(group_id, user_id)
    );
  `);

  seedData();
}

function seedData(): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const adminHash = bcrypt.hashSync('123456', 10);
  const playerHash = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare('INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)');
  insertUser.run('admin', adminHash, '店长', 'admin');
  insertUser.run('player', playerHash, '玩家小明', 'player');
  insertUser.run('player2', playerHash, '玩家小红', 'player');
  insertUser.run('player3', playerHash, '玩家小刚', 'player');

  const insertRoom = db.prepare('INSERT INTO rooms (name, capacity, duration, price, status, description) VALUES (?, ?, ?, ?, ?, ?)');
  insertRoom.run('古堡密室', 6, 180, 128, 'available', '欧式古堡风格主题房间，沉浸式布景');
  insertRoom.run('校园教室', 8, 240, 98, 'available', '还原校园场景，适合青春推理本');
  insertRoom.run('日式和室', 5, 150, 158, 'available', '日式风格房间，配有和服换装');
  insertRoom.run('恐怖暗房', 6, 180, 168, 'maintenance', '恐怖主题房间，声光电效果拉满');
  insertRoom.run('民国厅堂', 7, 210, 118, 'available', '民国风装修，旗袍换装体验');
  insertRoom.run('科幻舱室', 6, 180, 138, 'available', '未来科技风格，LED灯光营造氛围');

  const insertScript = db.prepare('INSERT INTO scripts (title, description, difficulty, duration, min_players, max_players) VALUES (?, ?, ?, ?, ?, ?)');
  insertScript.run('消失的证人', '一场突如其来的命案打破了小镇的宁静，所有嫌疑人都有不在场证明，真相到底是什么？', 'hard', 180, 4, 6);
  insertScript.run('校园失踪案', '高三学生林小雨突然失踪，同学们各执一词，谁在说谎？', 'easy', 120, 3, 5);
  insertScript.run('古宅惊魂', '百年古宅里接连发生诡异事件，受邀前来的客人们发现门已经被锁上...', 'medium', 150, 4, 6);
  insertScript.run('卧底风云', '警方卧底潜入犯罪集团，却发现自己不是唯一的卧底...', 'hard', 210, 5, 8);
  insertScript.run('时光旅店', '一家神秘旅店，每位住客都来自不同的年代，他们之间有什么联系？', 'medium', 150, 3, 6);
  insertScript.run('婚礼惊变', '豪门婚礼上新郎突然身亡，新娘、伴郎、前女友...谁是凶手？', 'easy', 120, 4, 7);
  insertScript.run('星际迷航', '太空站发生故障，船员们必须找出潜伏在人群中的异形生物。', 'hard', 180, 5, 8);

  const insertRating = db.prepare('INSERT INTO ratings (user_id, script_id, score, comment) VALUES (?, ?, ?, ?)');
  insertRating.run(2, 1, 5, '剧情太精彩了，反转一个接一个！');
  insertRating.run(3, 1, 4, '推理难度有点高，但很过瘾');
  insertRating.run(4, 1, 5, '强烈推荐，沉浸感很强');
  insertRating.run(2, 2, 4, '适合新手入门，节奏刚好');
  insertRating.run(3, 2, 3, '剧情稍简单，但趣味性不错');
  insertRating.run(2, 3, 5, '恐怖氛围营造得特别好，胆小慎入！');
  insertRating.run(4, 4, 5, '烧脑神作，DM带得也好');
  insertRating.run(3, 5, 4, '很有创意的设定，时间线设计巧妙');
  insertRating.run(2, 6, 4, '入门级好本，推荐新手');
  insertRating.run(4, 7, 5, '科幻迷必玩，世界观宏大');

  const insertBooking = db.prepare('INSERT INTO bookings (user_id, room_id, script_id, date, time_slot) VALUES (?, ?, ?, ?, ?)');
  const today = new Date().toISOString().split('T')[0];
  insertBooking.run(2, 1, 1, today, '14:00-17:00');
  insertBooking.run(3, 2, 2, today, '10:00-12:00');
  insertBooking.run(4, 3, 5, today, '18:00-20:30');

  const insertGroup = db.prepare('INSERT INTO group_invitations (creator_id, script_id, needed_players, date, time_slot, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertGroup.run(2, 1, 3, today, '14:00-17:00', '差三人开车，老手优先！', 'open');
  insertGroup.run(3, 4, 4, '2026-06-15', '19:00-22:00', '周末卧底局，等四个人凑齐', 'open');

  const insertGroupMember = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
  insertGroupMember.run(1, 2);
  insertGroupMember.run(2, 3);

  console.log('Database seeded successfully');
}

export default db;
