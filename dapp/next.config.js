const fs = require("fs");
const path = require("path");

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/api/auth/signin',
        permanent: true,
      },
    ]
  },
  env: {
    LATEST_MANIFEST_URI: fs.readFileSync(path.join(__dirname, "../LATEST_MANIFEST_URI.txt"), { encoding: 'utf8' })
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.arweave.net',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
      }
    ]
  },
}
module.exports = nextConfig