import fs from "fs";
import path from "path";

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
    domains: ['arweave.net'],
  },
}
module.exports = nextConfig