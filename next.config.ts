import type {NextConfig} from 'next';

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
