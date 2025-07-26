-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Enable read for all users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable insert for admin users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable update for admin users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable delete for admin users" ON subscription_plans;

-- Create simpler policies that don't reference user_profiles
CREATE POLICY "Enable read for all users" ON subscription_plans
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for admin users" ON subscription_plans
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'admin'
        )
    );

CREATE POLICY "Enable update for admin users" ON subscription_plans
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'admin'
        )
    );

CREATE POLICY "Enable delete for admin users" ON subscription_plans
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM user_profiles WHERE role = 'admin'
        )
    );

-- Also check and fix user_profiles policies to prevent recursion
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;

-- Recreate user_profiles policies without recursion
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );