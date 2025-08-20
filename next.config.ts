import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: ['http://3.85.34.51:3002', 'http://3.85.34.51:3003'],
  },
};

export default nextConfig;
