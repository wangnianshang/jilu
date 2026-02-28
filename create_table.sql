-- 创建 records 表
CREATE TABLE IF NOT EXISTS records (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS（行级安全策略）
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（服务角色有完全权限）
CREATE POLICY "Enable all for service_role" ON records
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
