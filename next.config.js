/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['xkvxpwsyvdvjrxnwtban.supabase.co'],
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignorer les erreurs ESLint pendant le build
  },
}

module.exports = nextConfig 