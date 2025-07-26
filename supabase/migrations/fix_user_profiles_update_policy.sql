-- Fix user_profiles update policy to allow users to update their own subscription status
-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new policy that allows users to update their own profile
CREATE POLICY "Users can update own profile" 
ON user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also ensure the table has proper permissions
GRANT UPDATE ON user_profiles TO authenticated;

-- Test query to verify the user can update their own profile
-- Run this in SQL editor with a user ID to test:
-- UPDATE user_profiles SET is_subscribed = true WHERE id = 'USER_ID_HERE';