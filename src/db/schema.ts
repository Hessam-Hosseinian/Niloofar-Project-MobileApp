export const schema = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  amount REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_key TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS preferences (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  title TEXT NOT NULL,
  notes TEXT,

  due_at TEXT,
  planned_day TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',

  repeat_type TEXT NOT NULL DEFAULT 'none',
  repeat_interval INTEGER NOT NULL DEFAULT 1,

  reminder_minutes INTEGER,
  notification_id TEXT,

  completed INTEGER NOT NULL DEFAULT 0,
  next_occurrence_created INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,

  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,

  FOREIGN KEY (task_id)
    REFERENCES tasks(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS focus_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  task_id INTEGER NOT NULL,

  started_at TEXT NOT NULL,
  ended_at TEXT,

  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (task_id)
    REFERENCES tasks(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  title TEXT NOT NULL,
  description TEXT,

  starts_at TEXT NOT NULL,
  ends_at TEXT,

  all_day INTEGER NOT NULL DEFAULT 0,

  reminder_minutes INTEGER,
  notification_id TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  title TEXT NOT NULL,
  color TEXT NOT NULL,

  cue TEXT,
  weekdays INTEGER NOT NULL DEFAULT 127,
  target_count INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'times',
  reminder_time TEXT,
  notification_ids TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  start_day TEXT,

  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  habit_id INTEGER NOT NULL,
  day TEXT NOT NULL,

  completed INTEGER NOT NULL DEFAULT 1,
  count INTEGER NOT NULL DEFAULT 1,
  skipped INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,

  UNIQUE(habit_id, day),

  FOREIGN KEY (habit_id)
    REFERENCES habits(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS habit_revisions (
  habit_id INTEGER NOT NULL,
  effective_day TEXT NOT NULL,
  weekdays INTEGER NOT NULL,
  target_count INTEGER NOT NULL,
  unit TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (habit_id, effective_day),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS music_tracks (
  id TEXT PRIMARY KEY NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('imported', 'device')),
  source_uri TEXT NOT NULL,
  storage_name TEXT,
  filename TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  duration_seconds REAL,
  file_size INTEGER,
  fingerprint TEXT UNIQUE,
  favorite INTEGER NOT NULL DEFAULT 0,
  play_count INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  missing INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS music_tracks_visible_idx ON music_tracks(hidden, missing, title);

CREATE TABLE IF NOT EXISTS music_play_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id TEXT NOT NULL,
  played_at TEXT NOT NULL,
  FOREIGN KEY (track_id) REFERENCES music_tracks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS music_play_history_track_idx ON music_play_history(track_id, id DESC);
`;
