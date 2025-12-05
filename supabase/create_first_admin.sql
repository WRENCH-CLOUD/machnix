-- Helper script to create your first platform admin
-- Run this after creating an auth user

-- Step 1: Create auth user in Supabase Dashboard or via SQL:
-- Go to Authentication > Users > Add User
-- OR use this (replace with your details):
/*
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@machnix.com',
    crypt('hello', gen_salt('bf')), -- Change password
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Super Admin"}'
);
*/

-- Step 2: Add the user to platform_admins
-- This automatically picks up the user you just created
INSERT INTO public.platform_admins (auth_user_id, name, email, phone, is_active, metadata)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'name', 'Super Admin'),
    email,
    raw_user_meta_data->>'phone',
    true,
    jsonb_build_object(
        'created_via', 'manual_seed',
        'created_at', NOW(),
        'initial_admin', true
    )
FROM auth.users
WHERE email = 'admin@machnix.com' -- Change to your admin email
ON CONFLICT (auth_user_id) DO NOTHING;

-- Verify the platform admin was created
SELECT 
    pa.id,
    pa.name,
    pa.email,
    pa.is_active,
    au.email as auth_email,
    au.email_confirmed_at
FROM public.platform_admins pa
JOIN auth.users au ON au.id = pa.auth_user_id
WHERE pa.email = 'admin@machnix.com'; -- Change to your admin email
