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
  webpack: (config) => {
    // Handle the Frame SDK package which may cause issues during build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

module.exports = nextConfig;
