import { createClient, RedisClientType } from "redis";

let client: RedisClientType;

export const connectRedis = async (): Promise<RedisClientType> => {
  client = createClient({ url: process.env.REDIS_URL as string });

  client.on("error", (err) => console.error("Redis Client Error", err));
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
