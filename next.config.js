/** @type {import('next').NextConfig} */

// GitHub Pages: статический экспорт (единственная платформа деплоя)
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  basePath: '/trip-schedule-app',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
