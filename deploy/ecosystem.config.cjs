// PM2 process file: keeps the site running and restarts it after crashes or reboots.
// Copy it into /var/www/sgx-website/ (live) and /var/www/sgx-website-staging/ (staging);
// it works out which one it is from the folder it sits in.
const path = require("path");

const staging = __dirname.endsWith("-staging");

module.exports = {
  apps: [
    {
      name: staging ? "sgx-website-staging" : "sgx-website",
      cwd: path.join(__dirname, "current"),
      script: "server.js",
      // Load secrets from the shared .env (Node 20.6+), outside the release folders.
      node_args: `--env-file=${path.join(__dirname, "shared/.env")}`,
      env: {
        NODE_ENV: "production",
        PORT: staging ? "3101" : "3100",
        HOSTNAME: "127.0.0.1", // only Nginx talks to the app directly
      },
      max_memory_restart: staging ? "400M" : "600M",
      time: true,
    },
  ],
};
