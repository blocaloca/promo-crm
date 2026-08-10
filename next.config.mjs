/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // downscaled photo uploads (main + thumb) go through a Server Action
      // as FormData; default 1mb cap is too small for full-res-ish images
      bodySizeLimit: "8mb",
    },
  },
};
export default nextConfig;
