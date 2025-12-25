import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("REDIS_URL is not defined. Redis features will not work.");
}

const redis = redisUrl ? new Redis(redisUrl) : null;

export default redis;

