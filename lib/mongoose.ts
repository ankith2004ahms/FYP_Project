import mongoose from "mongoose";
import dns from "node:dns";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const mongoUri = MONGODB_URI;

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached = (global as any)._mongoose as GlobalMongoose | undefined;

if (!cached) {
  cached = (global as any)._mongoose = { conn: null, promise: null };
}

function configureMongoDns() {
  if (!mongoUri.startsWith("mongodb+srv://")) return;

  const configuredServers = process.env.MONGODB_DNS_SERVERS
    ?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  dns.setServers(configuredServers?.length ? configuredServers : ["8.8.8.8", "1.1.1.1"]);
}

export async function connectMongoose() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    configureMongoDns();
    cached!.promise = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME,
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (error) {
    cached!.promise = null;
    throw error;
  }

  return cached!.conn;
}
