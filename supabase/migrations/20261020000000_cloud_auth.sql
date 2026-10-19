-- Migration: Cloud-based user authentication
-- Дата: 2026-10-20
-- Описание: Переносит пользователей из localStorage в Supabase, чтобы они работали
--           в любом браузере и на любом устройстве. Создаёт таблицы app_users и sessions,
--           а также SECURITY DEFINER RPC-функции для безопасного управления пользователями.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.app_users (
  username text PRIMARY KEY,
  password_hash text NOT NULL,
  salt text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL REFERENCES public.app_users(username) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expires_idx ON public.sessions(expires_at);
CREATE INDEX IF NOT EXISTS sessions_username_idx ON public.sessions(username);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RPC: login
CREATE OR REPLACE FUNCTION public.app_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user record;
  v_computed text;
  v_token uuid;
BEGIN
  SELECT username, password_hash, salt, is_admin INTO v_user
  FROM public.app_users WHERE username = p_username;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Неверный логин или пароль');
  END IF;

  v_computed := encode(digest(p_password || v_user.salt, 'sha256'), 'hex');
  IF v_computed <> v_user.password_hash THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Неверный логин или пароль');
  END IF;

  DELETE FROM public.sessions WHERE expires_at < now();

  INSERT INTO public.sessions (username, expires_at)
  VALUES (v_user.username, now() + interval '30 days')
  RETURNING token INTO v_token;

  RETURN jsonb_build_object(
    'ok', true,
    'session_token', v_token,
    'username', v_user.username,
    'is_admin', v_user.is_admin
  );
END;
$$;

-- RPC: validate session
CREATE OR REPLACE FUNCTION public.app_validate_session(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row record;
BEGIN
  SELECT s.username, u.is_admin INTO v_row
  FROM public.sessions s
  JOIN public.app_users u ON u.username = s.username
  WHERE s.token = p_token AND s.expires_at > now();

  IF v_row IS NULL THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  RETURN jsonb_build_object('ok', true, 'username', v_row.username, 'is_admin', v_row.is_admin);
END;
$$;

-- RPC: logout
CREATE OR REPLACE FUNCTION public.app_logout(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  DELETE FROM public.sessions WHERE token = p_token;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Helper: check admin session
CREATE OR REPLACE FUNCTION public._check_admin_session(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT u.is_admin INTO v_is_admin
  FROM public.sessions s
  JOIN public.app_users u ON u.username = s.username
  WHERE s.token = p_token AND s.expires_at > now();
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- RPC: list users (admin only)
CREATE OR REPLACE FUNCTION public.app_list_users(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_users jsonb;
BEGIN
  IF NOT public._check_admin_session(p_token) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Недостаточно прав');
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at), '[]'::jsonb) INTO v_users
  FROM (SELECT username, is_admin, created_at FROM public.app_users) t;

  RETURN jsonb_build_object('ok', true, 'users', v_users);
END;
$$;

-- RPC: upsert user (admin only)
CREATE OR REPLACE FUNCTION public.app_upsert_user(
  p_token uuid, p_username text, p_password text, p_is_admin boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_salt text := encode(gen_random_bytes(16), 'hex');
  v_hash text;
BEGIN
  IF NOT public._check_admin_session(p_token) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Недостаточно прав');
  END IF;

  IF p_username IS NULL OR length(trim(p_username)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Логин не может быть пустым');
  END IF;

  v_hash := encode(digest(p_password || v_salt, 'sha256'), 'hex');

  INSERT INTO public.app_users (username, password_hash, salt, is_admin)
  VALUES (p_username, v_hash, v_salt, COALESCE(p_is_admin, false))
  ON CONFLICT (username) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        salt = EXCLUDED.salt,
        is_admin = EXCLUDED.is_admin;

  RETURN jsonb_build_object('ok', true, 'username', p_username);
END;
$$;

-- RPC: import user with existing hash+salt (for migration from localStorage)
CREATE OR REPLACE FUNCTION public.app_import_user(
  p_token uuid, p_username text, p_password_hash text, p_salt text, p_is_admin boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public._check_admin_session(p_token) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Недостаточно прав');
  END IF;

  INSERT INTO public.app_users (username, password_hash, salt, is_admin)
  VALUES (p_username, p_password_hash, p_salt, COALESCE(p_is_admin, false))
  ON CONFLICT (username) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        salt = EXCLUDED.salt,
        is_admin = EXCLUDED.is_admin;

  RETURN jsonb_build_object('ok', true, 'username', p_username);
END;
$$;

-- RPC: delete user (admin only)
CREATE OR REPLACE FUNCTION public.app_delete_user(p_token uuid, p_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public._check_admin_session(p_token) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Недостаточно прав');
  END IF;

  DELETE FROM public.app_users WHERE username = p_username;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Seed default users (only if table is empty)
DO $$
DECLARE
  v_salt text;
  v_hash text;
  v_user record;
  v_defaults jsonb := '[
    {"u":"admin","p":"admin123","a":true},
    {"u":"user1","p":"pass123","a":false},
    {"u":"user2","p":"pass123","a":false},
    {"u":"user3","p":"pass123","a":false},
    {"u":"user4","p":"pass123","a":false},
    {"u":"user5","p":"pass123","a":false},
    {"u":"user6","p":"pass123","a":false},
    {"u":"user7","p":"pass123","a":false},
    {"u":"user8","p":"pass123","a":false},
    {"u":"user9","p":"pass123","a":false}
  ]'::jsonb;
BEGIN
  IF (SELECT count(*) FROM public.app_users) = 0 THEN
    FOR v_user IN SELECT * FROM jsonb_to_recordset(v_defaults) AS x(u text, p text, a boolean)
    LOOP
      v_salt := encode(gen_random_bytes(16), 'hex');
      v_hash := encode(digest(v_user.p || v_salt, 'sha256'), 'hex');
      INSERT INTO public.app_users (username, password_hash, salt, is_admin)
      VALUES (v_user.u, v_hash, v_salt, v_user.a);
    END LOOP;
  END IF;
END $$;
