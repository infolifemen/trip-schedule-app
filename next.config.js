/** @type {import('next').NextConfig} */

// Условная конфигурация: статический экспорт для GitHub Pages, обычный SSR для Vercel.
// При сборке на GitHub Pages workflow устанавливает GITHUB_PAGES='true'.
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = isGitHubPages
  ? {
      reactStrictMode: true,
      output: 'export',
      trailingSlash: true,
      basePath: '/trip-schedule-app',
      images: {
        unoptimized: true,
      },
    }
  : {
      reactStrictMode: true,
    };

module.exports = nextConfig;
