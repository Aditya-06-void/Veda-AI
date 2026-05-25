import Redis from "ioredis";

import { config } from "./config";
import { Assignment } from "./types";

type CacheClient = {
  isOpen: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  set: (key: string, value: string, options?: { EX?: number }) => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  del: (key: string) => Promise<unknown>;
  on: (event: string, listener: (error: unknown) => void) => void;
};

const { createClient } = require("redis") as {
  createClient: (options?: Record<string, unknown>) => CacheClient;
};

let cacheClient: CacheClient | null = null;
let bullConnection: Redis | null = null;
let redisReady = false;
const memoryCache = new Map<string, string>();

function hasRedisConfig() {
  return Boolean(
    config.redisUrl || (config.redisHost && config.redisPort && config.redisPassword),
  );
}

function buildRedisClient() {
  if (config.redisUrl) {
    return createClient({ url: config.redisUrl });
  }

  return createClient({
    username: config.redisUsername || "default",
    password: config.redisPassword,
    socket: {
      host: config.redisHost,
      port: config.redisPort,
    },
  });
}

function buildBullRedis() {
  if (config.redisUrl) {
    return new Redis(config.redisUrl, { maxRetriesPerRequest: null });
  }

  return new Redis({
    host: config.redisHost,
    port: config.redisPort,
    username: config.redisUsername || "default",
    password: config.redisPassword,
    maxRetriesPerRequest: null,
  });
}

export async function connectRedis() {
  if (!hasRedisConfig()) return false;
  if (redisReady && cacheClient && bullConnection) return true;

  try {
    cacheClient = buildRedisClient();
    cacheClient.on("error", (error: unknown) => {
      console.error("Redis cache client error", error);
    });
    await cacheClient.connect();

    bullConnection = buildBullRedis();
    await bullConnection.ping();

    redisReady = true;
    return true;
  } catch (error) {
    redisReady = false;
    if (cacheClient?.isOpen) {
      await cacheClient.disconnect();
    }
    cacheClient = null;
    bullConnection = null;
    console.error("Redis connection failed, falling back to memory cache.");
    return false;
  }
}

export function getRedisConnection() {
  return bullConnection;
}

export async function cacheAssignments(assignments: Assignment[]) {
  const value = JSON.stringify(assignments);
  if (redisReady && cacheClient?.isOpen) {
    await cacheClient.set("assignments:all", value, { EX: 60 });
    return;
  }
  memoryCache.set("assignments:all", value);
}

export async function readCachedAssignments() {
  const value =
    redisReady && cacheClient?.isOpen
      ? await cacheClient.get("assignments:all")
      : memoryCache.get("assignments:all");

  return value ? (JSON.parse(value) as Assignment[]) : null;
}

export async function clearAssignmentCache() {
  if (redisReady && cacheClient?.isOpen) {
    await cacheClient.del("assignments:all");
    return;
  }
  memoryCache.delete("assignments:all");
}
