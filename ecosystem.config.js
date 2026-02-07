const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

module.exports = [
  {
    script: "dist/src/index.js",
    name: "keep-it-batch-bot",
    autorestart: true,
    max_restarts: 0,
    min_uptime: "10s",
    max_memory_restart: "500M",
    restart_delay: 1000,
    watch: false,
    log_file: "./logs/combined.log",
    out_file: "./logs/out.log",
    error_file: "./logs/error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    max_log_size: "10M",
    retain_logs: 5,
    env: {
      TZ: "Asia/Seoul",
      KEEP_IT_DATABASE_HOST: process.env.KEEP_IT_DATABASE_HOST,
      KEEP_IT_DATABASE_PORT: process.env.KEEP_IT_DATABASE_PORT,
      KEEP_IT_DATABASE_USER: process.env.KEEP_IT_DATABASE_USER,
      KEEP_IT_DATABASE_PASSWORD: process.env.KEEP_IT_DATABASE_PASSWORD,
      KEEP_IT_DATABASE_NAME: process.env.KEEP_IT_DATABASE_NAME,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  },
];
