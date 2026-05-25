import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUrl: process.env.MONGODB_URI ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  redisHost: process.env.REDIS_HOST ?? "",
  redisPort: Number(process.env.REDIS_PORT ?? 0),
  redisUsername: process.env.REDIS_USERNAME ?? "",
  redisPassword: process.env.REDIS_PASSWORD ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  nvidiaApiKey: process.env.NVIDIA_API_KEY ?? "",
};
