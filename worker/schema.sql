PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 2,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  did_what TEXT,
  tasks_done TEXT,
  study_minutes INTEGER,
  procrastinated INTEGER,
  mood_score INTEGER,
  good_things TEXT,
  why_good TEXT,
  repeat_next TEXT,
  biggest_problem TEXT,
  root_cause TEXT,
  tomorrow_plan TEXT,
  happiest_moment TEXT,
  lowest_moment TEXT,
  triggers TEXT,
  spent_amount REAL,
  spent_value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_name TEXT NOT NULL,
  question TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  rule TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS punishments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  rule TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS finance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  type TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS diet_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  meal TEXT NOT NULL,
  calories INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_credentials (
  credential_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  device_type TEXT,
  backed_up INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS auth_challenges (
  flow_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('register', 'login')),
  challenge TEXT NOT NULL,
  origin TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('initial_savings', '0');
INSERT OR IGNORE INTO settings (key, value) VALUES ('body_weight_kg', '70');
INSERT OR IGNORE INTO settings (key, value) VALUES ('exercise_daily_min', '20');
INSERT OR IGNORE INTO settings (key, value) VALUES ('exercise_insufficient_days', '7');
INSERT OR IGNORE INTO settings (key, value) VALUES ('calorie_target', '2000');
INSERT OR IGNORE INTO settings (key, value) VALUES ('auth_user_name', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('auth_user_id', '');

INSERT OR IGNORE INTO prompts (id, group_name, question, enabled, order_index, created_at) VALUES
  (1, '每日复盘', '今天我做了什么？', 1, 1, '2026-03-20'),
  (2, '每日复盘', '完成了哪些任务？', 1, 2, '2026-03-20'),
  (3, '每日复盘', '学习了多久？', 1, 3, '2026-03-20'),
  (4, '每日复盘', '有没有拖延？', 1, 4, '2026-03-20'),
  (5, '每日复盘', '情绪状态如何？', 1, 5, '2026-03-20'),
  (6, '每日复盘', '今天哪三件事做得不错？', 1, 6, '2026-03-20'),
  (7, '每日复盘', '为什么做得好？', 1, 7, '2026-03-20'),
  (8, '每日复盘', '下次如何重复？', 1, 8, '2026-03-20'),
  (9, '每日复盘', '今天最大的问题是什么？', 1, 9, '2026-03-20'),
  (10, '每日复盘', '真正原因是什么？不是表面原因。', 1, 10, '2026-03-20'),
  (11, '每日复盘', '明天我具体要怎么做？（必须能执行）', 1, 11, '2026-03-20'),
  (12, '每日复盘', '今天什么时候最开心？触发原因？', 1, 12, '2026-03-20'),
  (13, '每日复盘', '什么时候最低落？触发原因？', 1, 13, '2026-03-20'),
  (14, '每日复盘', '今天花了多少钱？这笔钱值吗？', 1, 14, '2026-03-20'),
  (15, '每日复盘', '属于：投资自己 / 必要 / 冲动', 1, 15, '2026-03-20');
