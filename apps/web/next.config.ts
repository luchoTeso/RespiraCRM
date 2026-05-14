import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@respira/shared'],
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
