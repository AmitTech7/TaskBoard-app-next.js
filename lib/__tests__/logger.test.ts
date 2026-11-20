/* eslint-disable no-console -- we spy on console to check that logger() wraps it. */

async function loadLogger(nodeEnv: string) {
  jest.resetModules();
  jest.replaceProperty(process.env, "NODE_ENV", nodeEnv as "test");

  return (await import("../logger")).logger;
}

describe("logger", () => {
  beforeEach(() => {
    jest.spyOn(console, "debug").mockImplementation(() => undefined);
    jest.spyOn(console, "info").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("forwards every level to console outside production", async () => {
    const logger = await loadLogger("development");

    logger().debug("d");
    logger().info("i");
    logger().warn("w");
    logger().error("e", 1);

    expect(console.debug).toHaveBeenCalledWith("d");
    expect(console.info).toHaveBeenCalledWith("i");
    expect(console.warn).toHaveBeenCalledWith("w");
    expect(console.error).toHaveBeenCalledWith("e", 1);
  });

  it("silences debug and info in production", async () => {
    const logger = await loadLogger("production");

    logger().debug("d");
    logger().info("i");

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });

  it("still logs warnings and errors in production", async () => {
    const logger = await loadLogger("production");

    logger().warn("w");
    logger().error("e");

    expect(console.warn).toHaveBeenCalledWith("w");
    expect(console.error).toHaveBeenCalledWith("e");
  });
});
