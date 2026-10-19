'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Пароль доступен и клиенту (NEXT_PUBLIC_*) и серверу (SITE_PASSWORD).
    // Это позволяет использовать статический экспорт на GitHub Pages.
    // Серверный маршрут /api/login оставлен для обратной совместимости
    // с Vercel-сборкой, но больше не вызывается — проверка идёт здесь.
    const correctPassword =
      process.env.NEXT_PUBLIC_SITE_PASSWORD || 'grafik2026';

    if (!password) {
      setError('Введите пароль');
      setLoading(false);
      return;
    }

    if (password === correctPassword) {
      document.cookie =
        'trip_schedule_auth=true; path=/; max-age=2592000; SameSite=Lax';
      // router.push корректно учитывает basePath на GitHub Pages
      router.push('/');
    } else {
      setError('Неверный пароль');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0eeeb',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '32px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px',
            color: '#1a1a1a',
          }}
        >
          График командировок
        </h2>
        <p
          style={{
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '24px',
            color: '#6b7280',
          }}
        >
          Введите пароль для доступа
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#374151',
              }}
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="Введите пароль"
            />
          </div>

          {error && (
            <div
              style={{
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                marginBottom: '16px',
                color: '#dc2626',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '500',
              background: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) =>
              !loading && (e.currentTarget.style.background = '#2563eb')
            }
            onMouseOut={(e) =>
              !loading && (e.currentTarget.style.background = '#3b82f6')
            }
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
