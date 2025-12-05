-- Seed data for platform_admins
-- This creates the initial super admin user

-- First, create the auth user (you'll need to do this manually in Supabase dashboard or via API)
-- Email: admin@machnix.com
-- Password: (set in Supabase dashboard)

-- Then run this to add them to platform_admins table
-- Replace 'YOUR_AUTH_USER_ID' with the actual UUID from auth.users

-- Example (uncomment and replace with actual user ID):
-- INSERT INTO public.platform_admins (auth_user_id, name, email, phone, is_active, metadata)
-- VALUES (
--     'YOUR_AUTH_USER_ID'::uuid,
--     'Super Admin',
--     'admin@machnix.com',
--     '+91 99999 99999',
--     true,
--     '{"created_via": "seed", "initial_admin": true}'::jsonb
-- );

-- For local development, you can create a test admin:
-- 1. Sign up with email: admin@machnix.com
-- 2. Get the user ID from auth.users table
-- 3. Insert into platform_admins table:
--
-- INSERT INTO public.platform_admins (auth_user_id, name, email, phone, is_active)
-- SELECT id, 'Super Admin', email, NULL, true
-- FROM auth.users
-- WHERE email = 'admin@machnix.com'
-- ON CONFLICT (auth_user_id) DO NOTHING;
