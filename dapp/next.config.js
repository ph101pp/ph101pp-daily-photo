const fs = require("fs");
const path = require("path");

const nextConfig = {
  env: {
    LATEST_MANIFEST_URI: fs.readFileSync(path.join(__dirname, "../LATEST_MANIFEST_URI.txt"), { encoding: 'utf8' })
  }
}
module.exports = nextConfig