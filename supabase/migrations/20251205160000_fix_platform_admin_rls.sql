-- Fix RLS policy for platform_admins to allow users to check their own admin status during login
-- This fixes the chicken-and-egg problem where users can't login because they can't read the table

-- Drop the overly restrictive policies that cause infinite recursion
DROP POLICY IF EXISTS "Platform admins can read all platform_admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Users can check their own platform admin status" ON public.platform_admins;

-- Create a simple policy: authenticated users can read their own record
-- This allows login to work without infinite recursion
CREATE POLICY "Allow authenticated users to read their own admin record"
    ON public.platform_admins
    FOR SELECT
    USING (
        auth.uid() = auth_user_id AND is_active = true
    );

-- Add comment explaining the policy design
COMMENT ON POLICY "Allow authenticated users to read their own admin record" ON public.platform_admins IS 
    'Allows authenticated users to check if they are a platform admin during login. Avoids infinite recursion by not querying the same table in the policy.';
