/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5001', pathname: '/uploads/**' },
    ],
  },
};

module.exports = nextConfig;
