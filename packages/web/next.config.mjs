/** @type {import('next').NextConfig} */

const nextConfig = {
  env: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  staticPageGenerationTimeout: 300,
  // logging: {
  //   fetches: {
  //     fullUrl: true,
  //   },
  // },
};

export default nextConfig;
