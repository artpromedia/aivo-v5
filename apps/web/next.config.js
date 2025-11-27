/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds - run separately
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Build continues even with type errors (handled by tsc separately)
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@aivo/agents',
      '@aivo/brain-model',
      '@tensorflow/tfjs-node',
      '@tensorflow/tfjs',
      '@mapbox/node-pre-gyp',
      'ioredis',
      'aws-sdk',
      'mock-aws-s3',
      'nock',
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
        child_process: false,
      };
    }
    
    // Externalize problematic modules on server side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
        '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
        'aws-sdk': 'commonjs aws-sdk',
        'mock-aws-s3': 'commonjs mock-aws-s3',
        'nock': 'commonjs nock',
      });
    }
    
    // Exclude node-pre-gyp HTML files from being processed
    config.module.rules.push({
      test: /\.html$/,
      include: /node-pre-gyp/,
      type: 'asset/source',
    });

    // Handle .node binary files (native modules)
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    
    return config;
  },
};

module.exports = nextConfig;
