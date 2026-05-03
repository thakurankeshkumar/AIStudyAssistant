import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const isDevelopment = process.env.NODE_ENV !== "production";

if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in .env.local");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            dbName: "ai-study-assistant",
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        throw error;
    }

    return cached.conn;
}

export function isDatabaseConnectionError(error) {
    return (
        error?.name === "MongooseServerSelectionError" ||
        error?.name === "MongoServerSelectionError" ||
        error?.message?.includes("Could not connect to any servers")
    );
}

export function databaseUnavailableResponse() {
    return Response.json(
        {
            error:
                "Database connection failed. Your MongoDB Atlas cluster is likely blocking this IP address. Add your current IP in Atlas Network Access, then try again.",
            ...(isDevelopment
                ? {
                    details:
                        "MongoDB Atlas Network Access: add your current IP address, or temporarily allow 0.0.0.0/0 for local development only.",
                }
                : {}),
        },
        { status: 503 }
    );
}
