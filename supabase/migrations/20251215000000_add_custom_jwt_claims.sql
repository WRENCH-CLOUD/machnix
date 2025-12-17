-- -- Create a function to add custom claims to the JWT
-- CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
-- RETURNS jsonb
-- LANGUAGE plpgsql
-- STABLE
-- AS $$
-- DECLARE
--   claims jsonb;
--   user_role text;
--   user_tenant_id uuid;
--   user_type text;
-- BEGIN
--   -- Get the user's claims from the event
--   claims := event->'claims';
  
--   -- Get the user's app_metadata
--   user_role := (event->'authentication_method'->'data'->>'app_metadata')::jsonb->>'role';
--   user_tenant_id := (event->'authentication_method'->'data'->>'app_metadata')::jsonb->>'tenant_id';
--   user_type := (event->'authentication_method'->'data'->>'app_metadata')::jsonb->>'user_type';
  
--   -- If we couldn't get from authentication_method, try from the user record directly
--   IF user_role IS NULL THEN
--     SELECT 
--       raw_app_meta_data->>'role',
--       raw_app_meta_data->>'tenant_id',
--       raw_app_meta_data->>'user_type'
--     INTO user_role, user_tenant_id, user_type
--     FROM auth.users
--     WHERE id = (event->>'user_id')::uuid;
--   END IF;
  
--   -- Add the custom claims to the JWT
--   IF user_role IS NOT NULL THEN
--     claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
--   END IF;
  
--   IF user_tenant_id IS NOT NULL THEN
--     claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
--   END IF;
  
--   IF user_type IS NOT NULL THEN
--     claims := jsonb_set(claims, '{user_type}', to_jsonb(user_type));
--   END IF;
  
--   -- Update the event with the new claims
--   event := jsonb_set(event, '{claims}', claims);
  
--   RETURN event;
-- END;
-- $$;

-- -- Grant execute permission
-- GRANT EXECUTE ON FUNCTION auth.custom_access_token_hook TO supabase_auth_admin;
-- REVOKE EXECUTE ON FUNCTION auth.custom_access_token_hook FROM authenticated, anon, public;

-- COMMENT ON FUNCTION auth.custom_access_token_hook IS 'Adds custom claims (role, tenant_id, user_type) from app_metadata to JWT tokens';
