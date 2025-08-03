-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only access their own record
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Domains table policies  
-- Users can only access domains they own
CREATE POLICY "Users can view own domains" ON domains
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own domains" ON domains
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own domains" ON domains
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own domains" ON domains
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Scans table policies
-- Users can view their own scans + public scans (for free tier)
CREATE POLICY "Users can view own scans" ON scans
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    (is_public_scan = true AND user_id IS NULL)
  );

CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text OR 
    (is_public_scan = true AND user_id IS NULL)
  );

CREATE POLICY "Users can update own scans" ON scans
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Scan results table policies
-- Users can only view results for scans they own or public scans
CREATE POLICY "Users can view scan results" ON scan_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scans 
      WHERE scans.id = scan_results.scan_id 
      AND (
        auth.uid()::text = scans.user_id::text OR 
        (scans.is_public_scan = true AND scans.user_id IS NULL)
      )
    )
  );

CREATE POLICY "System can insert scan results" ON scan_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans 
      WHERE scans.id = scan_results.scan_id
    )
  );

-- Reports table policies
-- Users can only view reports for scans they own or public scans
CREATE POLICY "Users can view reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scans 
      WHERE scans.id = reports.scan_id 
      AND (
        auth.uid()::text = scans.user_id::text OR 
        (scans.is_public_scan = true AND scans.user_id IS NULL)
      )
    )
  );

CREATE POLICY "System can insert reports" ON reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans 
      WHERE scans.id = reports.scan_id
    )
  );

-- API Keys table policies
-- Users can only access their own API keys
CREATE POLICY "Users can view own api keys" ON api_keys
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own api keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own api keys" ON api_keys
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own api keys" ON api_keys
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Usage Stats table policies
-- Users can only view their own usage stats
CREATE POLICY "Users can view own usage stats" ON usage_stats
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert usage stats" ON usage_stats
  FOR INSERT WITH CHECK (true); -- System service can insert for any user

-- Service role policies (for backend operations)
-- These policies allow the service role to perform necessary operations
CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access domains" ON domains
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access scans" ON scans
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access scan_results" ON scan_results
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access reports" ON reports
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access api_keys" ON api_keys
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role full access usage_stats" ON usage_stats
  FOR ALL USING (current_setting('role') = 'service_role');