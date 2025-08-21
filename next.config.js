/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations for faster compilation
  compiler: {
    // Use SWC for faster compilation
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    // Reduce worker count for development to avoid resource conflicts
    workerThreads: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // This will prevent ESLint from running on any directories
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Skip linting and type checking in production builds
  productionBrowserSourceMaps: false,
  // Webpack optimizations for faster compilation
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Reduce bundle analysis overhead in development
      config.optimization.usedExports = false;
      config.optimization.sideEffects = false;
      // Skip expensive optimizations in dev
      config.optimization.splitChunks = false;
    }
    return config;
  },
};

module.exports = nextConfig;
