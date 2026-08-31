import {
  describe,
  expect,
  jest,
  test,
  beforeEach,
  afterEach,
} from "@jest/globals";

await jest.unstable_mockModule("mongoose", () => {
  const mongoose = {
    connection: { readyState: 0 },
    connect: jest.fn(),
  };
  return { default: mongoose };
});

const { default: mongoose } = await import("mongoose");
const { isDatabaseConnected, connectToDatabase } = await import("../db.js"); // adjust path if needed

const MONGO_CACHE_KEY = "__athenaNexusMongoCache";

beforeEach(() => {
  const cache = globalThis[MONGO_CACHE_KEY];
  if (cache) {
    cache.connection = null;
    cache.connectingPromise = null;
  } else {
    globalThis[MONGO_CACHE_KEY] = { connection: null, connectingPromise: null };
  }

  jest.clearAllMocks();
  mongoose.connect.mockReset(); // remove any stale implementation from previous tests

  mongoose.connection.readyState = 0;
  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = "mongodb://test-default:27017/testdb";
});

afterEach(() => {
  delete process.env.MONGODB_URI;
  process.env.NODE_ENV = "test";
});

describe("isDatabaseConnected", () => {
  test("returns true when readyState is 1", () => {
    mongoose.connection.readyState = 1;
    expect(isDatabaseConnected()).toBe(true);
  });

  test("returns false when readyState is not 1", () => {
    mongoose.connection.readyState = 0;
    expect(isDatabaseConnected()).toBe(false);
    mongoose.connection.readyState = 2;
    expect(isDatabaseConnected()).toBe(false);
  });
});

describe("connectToDatabase", () => {
  test("returns existing connection if already connected", async () => {
    const fakeConnection = { name: "test-connection" };
    globalThis[MONGO_CACHE_KEY].connection = fakeConnection;
    mongoose.connection.readyState = 1;

    const result = await connectToDatabase();

    expect(result).toBe(fakeConnection);
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("calls mongoose.connect when not connected", async () => {
    const fakeConnection = { name: "new-connection" };
    mongoose.connect.mockResolvedValue(fakeConnection);

    const result = await connectToDatabase();

    expect(mongoose.connect).toHaveBeenCalledWith(expect.any(String), {
      bufferCommands: false,
    });
    expect(result).toBe(fakeConnection);
    expect(globalThis[MONGO_CACHE_KEY].connection).toBe(fakeConnection);
  });

  test("uses MONGODB_URI when set", async () => {
    process.env.MONGODB_URI = "mongodb://custom-host:27017/customdb";
    mongoose.connect.mockResolvedValue({ name: "conn" });

    await connectToDatabase();

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://custom-host:27017/customdb",
      expect.any(Object),
    );
  });

  test("uses default localhost URI in non-production when MONGODB_URI missing", async () => {
    delete process.env.MONGODB_URI;
    process.env.NODE_ENV = "development";
    mongoose.connect.mockResolvedValue({ name: "local" });

    await connectToDatabase();

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/athena-nexus",
      expect.any(Object),
    );
  });

  test("throws error in production when MONGODB_URI missing", async () => {
    delete process.env.MONGODB_URI;
    process.env.NODE_ENV = "production";

    await expect(connectToDatabase()).rejects.toThrow(
      "MONGODB_URI is not configured",
    );

    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("reuses existing connectingPromise when concurrent calls", async () => {
    const fakePromise = Promise.resolve({ name: "shared" });
    mongoose.connect.mockReturnValue(fakePromise);

    const firstCall = connectToDatabase();
    const cachedPromise = globalThis[MONGO_CACHE_KEY].connectingPromise;
    const secondCall = connectToDatabase();

    expect(globalThis[MONGO_CACHE_KEY].connectingPromise).toBe(cachedPromise);
    expect(mongoose.connect).toHaveBeenCalledTimes(1);

    await expect(firstCall).resolves.toEqual({ name: "shared" });
    await expect(secondCall).resolves.toEqual({ name: "shared" });
  });

  test("clears connection and rethrows on connect failure", async () => {
    const error = new Error("connection failed");
    mongoose.connect.mockRejectedValue(error);

    await expect(connectToDatabase()).rejects.toThrow("connection failed");
    expect(globalThis[MONGO_CACHE_KEY].connection).toBeNull();
    expect(globalThis[MONGO_CACHE_KEY].connectingPromise).toBeNull();
  });
});
