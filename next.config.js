/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['prisma'],
  },
  // Skip static generation during build for routes that need database access
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    if (dev) {
      return defaultPathMap
    }
    
    // Return minimal static pages for build
    return {
      '/': { page: '/' },
    }
  },
}
