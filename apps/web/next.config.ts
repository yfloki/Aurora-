import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@aurora/shared'],
  images: { unoptimized: true }, // imagens vêm do media server local
};
export default config;
