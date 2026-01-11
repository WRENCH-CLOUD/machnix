CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb := coalesce(event->'claims', '{}'::jsonb);
  meta jsonb;
  user_role text;
  user_tenant_id text;
  user_type text;
BEGIN
  -- Safely extract app_metadata from event
  meta := event #> '{authentication_method,data,app_metadata}';

  IF meta IS NULL THEN
    SELECT raw_app_meta_data
    INTO meta
    FROM auth.users
    WHERE id = (event->>'user_id')::uuid;
  END IF;

  IF meta IS NOT NULL THEN
    user_role := meta->>'role';
    user_tenant_id := meta->>'tenant_id';
    user_type := meta->>'user_type';
  END IF;

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role), true);
  END IF;

  IF user_tenant_id IS NOT NULL AND user_tenant_id <> '' THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id), true);
  END IF;

  IF user_type IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_type}', to_jsonb(user_type), true);
  END IF;

  RETURN jsonb_set(event, '{claims}', claims, true);
END;
$$;

GRANT EXECUTE ON FUNCTION auth.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION auth.custom_access_token_hook FROM authenticated, anon, public;
