/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'i.imgur.com', 
      'imgur.com', 
      'pbs.twimg.com', 
      'abs.twimg.com',
      'corsproxy.io',
      'api.allorigins.win',
      'res.cloudinary.com',
      'ipfs.decentralized-content.com',
      'warpcast.com',
      'i.seadn.io'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
};

module.exports = nextConfig;
