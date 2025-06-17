// next.config.js

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

import webpack from 'webpack'; // Import webpack directly

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // --- ADD THIS EXPERIMENTAL CONFIGURATION ---
  experimental: {
    // This makes pdf-parse an external package for server components/API routes.
    // It prevents Next.js from trying to deeply bundle it, potentially avoiding
    // issues with its internal file access patterns.
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  // --- END EXPERIMENTAL CONFIGURATION ---
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
      };
    }

    // Keep the IgnorePlugins for now, as they generally don't hurt and might
    // catch other subtle issues.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /.*\.pdf$/,
        contextRegExp: /test[\\\/]data/,
      })
    );

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(canvas|jsdom)$/,
        contextRegExp: /pdf-parse/,
      })
    );

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /pdfjs-dist\/build\/pdf\.worker\.js/,
        contextRegExp: /pdf-parse/,
      })
    );

    return config;
  },  
};

export default config;