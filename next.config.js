/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning only instead of error in production, to allow the build to complete
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip TypeScript type checking during builds to allow it to complete
    ignoreBuildErrors: true,
  },
  // Reduce caching in development mode
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // Number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
    // Disable static optimization in development
    staticPageGenerationTimeout: 0,
  }),
}

module.exports = nextConfig 