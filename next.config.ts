/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow running on all network interfaces for Docker deployment
  experimental: {},
  // Expose the worker script name as a build-time env variable.
  // This prevents Turbopack from seeing the literal string 'scanner-worker.js'
  // inside route.ts and attempting to resolve it as a JavaScript module.
  env: {
    WORKER_SCRIPT_NAME: 'scanner-worker.js',
  },
};

export default nextConfig;
