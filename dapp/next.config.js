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
    LATEST_MANIFEST_URI: process.env.LATEST_MANIFEST_URI
  }
}
module.exports = nextConfig