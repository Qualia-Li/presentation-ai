// next.config.js

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

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
      // You might also need to add 'nextjs.org' here if your src/app/page.tsx
      // still uses images from nextjs.org (e.g., icons/next.svg, icons/vercel.svg)
      // {
      //   protocol: 'https',
      //   hostname: 'nextjs.org',
      //   pathname: '/icons/**',
      // },
    ],
  },
  // --- ADD THIS WEBPACK CONFIGURATION BLOCK ---
  webpack: (config, { isServer }) => {
    // If it's a client-side bundle, prevent 'fs' from being included.
    // This is a common workaround for libraries that might accidentally
    // pull in Node.js-specific modules into the client-side bundle.
    if (!isServer) {
      config.resolve.fallback = {
        fs: false, // Prevents 'fs' (file system) module from being bundled
      };
    }
    return config;
  },
  // --- END OF WEBPACK CONFIGURATION BLOCK ---
};

export default config;