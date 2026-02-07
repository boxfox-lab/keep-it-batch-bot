const {
  KEEP_IT_DATABASE_HOST,
  KEEP_IT_DATABASE_NAME,
  KEEP_IT_DATABASE_USER,
  KEEP_IT_DATABASE_PASSWORD,
  KEEP_IT_DATABASE_PORT,
} = process.env;

export {
  KEEP_IT_DATABASE_HOST,
  KEEP_IT_DATABASE_NAME,
  KEEP_IT_DATABASE_USER,
  KEEP_IT_DATABASE_PASSWORD,
  KEEP_IT_DATABASE_PORT,
};

export const KEEP_IT_DATABASE_CONFIG = () =>
  ({
    host: process.env.KEEP_IT_DATABASE_HOST,
    port: Number(process.env.KEEP_IT_DATABASE_PORT) || 5432,
    username: process.env.KEEP_IT_DATABASE_USER,
    password: process.env.KEEP_IT_DATABASE_PASSWORD,
    database: process.env.KEEP_IT_DATABASE_NAME,
  }) as const;
