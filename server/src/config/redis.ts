import { createClient, RedisClientType } from "redis";

let client: RedisClientType;

export const connectRedis = async (): Promise<RedisClientType> => {
  client = createClient({
    url: process.env.REDIS_URL as string,
    socket: {
      reconnectStrategy: () => {
        // Fail fast: don't retry if Redis is unavailable.
        // The caller handles this gracefully and falls back to no-cache mode.
        return new Error("Redis unavailable — skipping connection");
      },
      connectTimeout: 5000, // 5 second timeout
    },
  });

  client.on("error", (err) => {
    // Log once at debug level; suppress reconnect noise since we don't retry.
    if (!(err instanceof Error) || !err.message.includes("skipping")) {
      console.warn("Redis Client Error:", err.message);
    }
  });
  client.on("connect", () => console.log("Redis connected"));

  await client.connect();
  return client;
};

export const getRedisClient = (): RedisClientType => {
  if (!client) {
    throw new Error("Redis client not initialized. Call connectRedis first.");
  }
  return client;
};
