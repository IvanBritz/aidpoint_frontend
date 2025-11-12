/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Remove experimental config that might cause issues
  // experimental: {
  //   serverComponentsExternalPackages: []
  // },
}

module.exports = nextConfig
