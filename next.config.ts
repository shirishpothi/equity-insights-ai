import type {NextConfig} from 'next';
import path from 'path';

// Check if we're building for GitHub Pages
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Build caching configuration
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable webpack build cache
  webpack: (config, { dev, isServer, webpack }) => {
    // Enable webpack persistent caching
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve('.next/cache/webpack'),
      };
    }

    // Optimize chunks for better caching
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: isGitHubPages, // Only unoptimize for GitHub Pages
  },

  // Only enable static export for GitHub Pages
  ...(isGitHubPages && {
    output: 'export',
    trailingSlash: true,
    basePath: '/Equity Insights AI',
  }),

};

export default nextConfig;
