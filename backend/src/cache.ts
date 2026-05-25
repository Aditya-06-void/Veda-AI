import Redis from "ioredis";

import { config } from "./config";
import { Assignment } from "./types";

let redis: Redis | null = null;
let redisReady = false;
const memoryCache = new Map<string, string>();

export async function connectRedis() {
  if (!config.redisUrl) return false;
  if (redisReady && redis) return true;

  try {
    redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
    await redis.ping();
    redisReady = true;
    return true;
  } catch {
    redisReady = false;
    redis = null;
    return false;
  }
}

export function getRedisConnection() {
  return redis;
}

export async function cacheAssignments(assignments: Assignment[]) {
  const value = JSON.stringify(assignments);
  if (redisReady && redis) {
    await redis.set("assignments:all", value, "EX", 60);
    return;
  }
  memoryCache.set("assignments:all", value);
}

export async function readCachedAssignments() {
  const value = redisReady && redis
    ? await redis.get("assignments:all")
    : memoryCache.get("assignments:all");

  return value ? (JSON.parse(value) as Assignment[]) : null;
}

export async function clearAssignmentCache() {
  if (redisReady && redis) {
    await redis.del("assignments:all");
    return;
  }
  memoryCache.delete("assignments:all");
}
