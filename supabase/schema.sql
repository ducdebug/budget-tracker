CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  avatar        TEXT DEFAULT '👤',
  avatar_url    TEXT DEFAULT NULL,    
  total_balance BIGINT NOT NULL DEFAULT 0,
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value) VALUES
  ('registration_enabled', 'true'),
  ('allow_balance_edit', 'true')
ON CONFLICT (key) DO NOTHING;
CREATE TABLE IF NOT EXISTS categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  icon          TEXT DEFAULT '📦',
  type          TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  monthly_limit BIGINT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  amount      BIGINT NOT NULL CHECK (amount > 0),
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created
  ON transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category_created
  ON transactions (category_id, created_at DESC);

CREATE TABLE IF NOT EXISTS debts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  debtor_name TEXT NOT NULL,
  amount      BIGINT NOT NULL CHECK (amount > 0),
  note        TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_user_status
  ON debts (user_id, status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "Allow insert for auth" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- Debts: everyone can read/write
CREATE POLICY "Allow all on debts" ON debts FOR ALL USING (true) WITH CHECK (true);

-- App settings: everyone can read, only admin can write
CREATE POLICY "Anyone can read settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Admin can update settings" ON app_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND is_admin = true)
);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
--
-- CREATE POLICY "Anyone can upload avatar" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'avatars');
-- CREATE POLICY "Anyone can update avatar" ON storage.objects
--   FOR UPDATE USING (bucket_id = 'avatars');
-- CREATE POLICY "Avatars are publicly readable" ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can delete own avatar" ON storage.objects
--   FOR DELETE USING (bucket_id = 'avatars');
