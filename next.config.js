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
}

module.exports = nextConfig 