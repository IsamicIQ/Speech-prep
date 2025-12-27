-- Clear All Users and Profiles from Supabase
-- WARNING: This will delete ALL users and their data!
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Step 1: Delete all sessions (they reference users via foreign key)
DELETE FROM sessions;

-- Step 2: Delete all profiles
DELETE FROM profiles;

-- Step 3: Delete all auth users
-- Note: This requires admin access. If you get a permission error,
-- you may need to delete users manually from the Authentication > Users page in Supabase dashboard
-- 
-- IMPORTANT: If the DELETE FROM auth.users command fails, use the Supabase dashboard instead:
-- 1. Go to Authentication > Users in your Supabase dashboard
-- 2. Select all users (or specific users you want to delete)
-- 3. Click "Delete selected users" or the trash icon
--
DELETE FROM auth.users;

-- After running this, you can create a new account with any email address.
-- 
-- TIP: If you're still having signup issues after clearing users, check:
-- 1. Settings > Authentication > Email Auth > "Enable email confirmations" - consider disabling for development
-- 2. Settings > Authentication > Email Auth > "Secure email change" - consider disabling for development

