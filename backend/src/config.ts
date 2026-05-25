import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUrl: process.env.MONGODB_URI ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
};
