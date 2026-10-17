/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server-side redirects that work at Vercel Edge level
  // These run BEFORE middleware, so they work even if middleware fails
  async redirects() {
    return []
  },
}

module.exports = nextConfig
