-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.schema_migrations (
  version text NOT NULL,
  applied_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schema_migrations_pkey PRIMARY KEY (version)
);
CREATE TABLE public.vehicle_category (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  CONSTRAINT vehicle_category_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vehicle_make (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_make_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vehicle_model (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  make_id uuid NOT NULL,
  name text NOT NULL,
  model_code text,
  vehicle_category text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_model_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_model_make_id_fkey FOREIGN KEY (make_id) REFERENCES public.vehicle_make(id)
);