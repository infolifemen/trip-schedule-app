'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Клиентская проверка авторизации.
 * Нужна на GitHub Pages, где нет серверного middleware.
 * На Vercel middleware делает то же самое на сервере, AuthGate здесь безвреден.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const cookies = document.cookie
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean);
    const isAuth = cookies.includes('trip_schedule_auth=true');

    if (!isAuth) {
      router.replace('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (authorized === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0eeeb',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#6b7280',
          fontSize: 14,
        }}
      >
        Проверка авторизации…
      </div>
    );
  }

  return <>{children}</>;
}
