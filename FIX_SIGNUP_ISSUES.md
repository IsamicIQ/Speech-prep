# Fixing Signup Issues

## Problem
You're seeing "An account with this email already exists" even when there are no accounts with that email.

## Solutions

### 1. Clear All Users (Recommended First Step)

**Option A: Using SQL (if you have admin access)**
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `clear-users.sql`
4. Click **Run**

**Option B: Using Supabase Dashboard**
1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Select all users (or the specific users you want to delete)
3. Click **Delete selected users** or the trash icon
4. Confirm the deletion

### 2. Disable Email Confirmation (For Development)

If you're in development mode and don't want to deal with email confirmations:

1. Go to your Supabase dashboard
2. Navigate to **Settings** > **Authentication** > **Email Auth**
3. **Disable** "Enable email confirmations"
4. Save the changes

This will allow users to sign up immediately without needing to confirm their email.

### 3. Check for Unconfirmed Users

Sometimes users are created but not confirmed. To check:

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Look for users with "Unconfirmed" status
3. Delete them if you want to allow new signups with those emails

### 4. Verify Database Setup

Make sure you've run the `supabase-setup.sql` script:

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-setup.sql`
3. Click **Run**

This ensures:
- The `profiles` table exists
- The trigger for automatic profile creation is set up
- Row Level Security policies are configured

### 5. Check Error Messages

The app now shows the actual error message from Supabase instead of a generic message. Common errors:

- **"User already registered"** - The email is already in use (even if unconfirmed)
- **"Email rate limit exceeded"** - Too many signup attempts
- **"Password should be at least 6 characters"** - Password too short
- **"Invalid email"** - Email format is incorrect

### 6. Test Signup Again

After clearing users and disabling email confirmation:

1. Try signing up with a new email
2. Check the browser console (F12) for any errors
3. Check the Supabase dashboard to see if the user was created

## Troubleshooting

### Profile Not Created
If the user is created but the profile isn't:

1. Check if the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Manually create the profile:
   ```sql
   INSERT INTO profiles (id, name, email)
   VALUES ('user-id-here', 'User Name', 'user@example.com');
   ```

### Still Having Issues?
1. Check the browser console for JavaScript errors
2. Check the Supabase logs (Dashboard > Logs)
3. Verify your Supabase credentials in `src/lib/supabase.ts` or `.env` file

