/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Статический экспорт — моментальная загрузка без сервера
  output: 'export',
  // Отключаем Image Optimization для статического экспорта
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
