-- Create a function to activate user subscription
-- This bypasses RLS issues by running with SECURITY DEFINER

CREATE OR REPLACE FUNCTION activate_user_subscription(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Update the user's subscription status
  UPDATE user_profiles
  SET is_subscribed = true
  WHERE id = user_id;
  
  -- If no row was updated, insert a new profile
  IF NOT FOUND THEN
    INSERT INTO user_profiles (id, email, role, is_subscribed)
    SELECT id, email, 'user', true
    FROM auth.users
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION activate_user_subscription TO authenticated;