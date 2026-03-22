import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached = (global as any)._mongoose as GlobalMongoose | undefined;

if (!cached) {
  cached = (global as any)._mongoose = { conn: null, promise: null };
}

export async function connectMongoose() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME,
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

