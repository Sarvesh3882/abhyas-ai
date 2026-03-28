/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: [] },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}
module.exports = nextConfig
