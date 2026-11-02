/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.geojson$/,
      type: 'json',
    });
    return config;
  },
};

module.exports = nextConfig;
