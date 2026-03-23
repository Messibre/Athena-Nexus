import mongoose from "mongoose";

const MONGO_CACHE_KEY = "__athenaNexusMongoCache";

if (!globalThis[MONGO_CACHE_KEY]) {
  globalThis[MONGO_CACHE_KEY] = {
    connection: null,
    connectingPromise: null,
  };
}

const mongoCache = globalThis[MONGO_CACHE_KEY];

const getMongoUri = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  if (process.env.NODE_ENV !== "production") {
    return "mongodb://localhost:27017/athena-nexus";
  }

  throw new Error("MONGODB_URI is not configured");
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export const connectToDatabase = async () => {
  if (mongoCache.connection && isDatabaseConnected()) {
    return mongoCache.connection;
  }

  if (!mongoCache.connectingPromise) {
    const mongoUri = getMongoUri();

    mongoCache.connectingPromise = mongoose
      .connect(mongoUri, {
        bufferCommands: false,
      })
      .then((connection) => {
        mongoCache.connection = connection;
        return connection;
      })
      .catch((error) => {
        mongoCache.connection = null;
        throw error;
      })
      .finally(() => {
        mongoCache.connectingPromise = null;
      });
  }

  return mongoCache.connectingPromise;
};
