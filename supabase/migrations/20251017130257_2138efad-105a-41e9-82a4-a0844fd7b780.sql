-- Creazione Admin User
-- Email: paolo.baldassare@gmail.com
-- Password: Leone123!

-- Abilita pgcrypto per crypt() e gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'paolo.baldassare@gmail.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      role,
      aud,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'paolo.baldassare@gmail.com',
      extensions.crypt('Leone123!', extensions.gen_salt('bf')),
      now(),
      '{"role": "admin"}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      'authenticated',
      'authenticated',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;
