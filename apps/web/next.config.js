/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@aivo/agents',
      '@tensorflow/tfjs-node',
      '@mapbox/node-pre-gyp',
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle native modules that can't be bundled
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        buffer: false,
      };
    }
    
    // Exclude node-pre-gyp HTML files from being processed
    config.module.rules.push({
      test: /\.html$/,
      include: /node-pre-gyp/,
      type: 'asset/source',
    });
    
    return config;
  },
};

module.exports = nextConfig;
