// PM2 process file: keeps the site running and restarts it after crashes or reboots.
// On the server:  pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: "sgx-website",
      cwd: "/var/www/sgx-website/current",
      script: "server.js",
      // Load secrets from the shared .env (Node 20.6+), outside the release folders.
      node_args: "--env-file=/var/www/sgx-website/shared/.env",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
        HOSTNAME: "127.0.0.1", // only Nginx talks to the app directly
      },
      max_memory_restart: "600M",
      time: true,
    },
  ],
};
