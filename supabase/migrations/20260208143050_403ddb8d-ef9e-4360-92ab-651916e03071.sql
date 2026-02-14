-- Add pro_loco role to the app_role enum (first migration)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pro_loco';