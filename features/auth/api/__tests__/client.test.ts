import { apiClient } from "@/lib/api/client";

import { fetchCurrentUser, loginRequest, logoutRequest } from "../client";

jest.mock("@/lib/api/client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const SUCCESS = { status: true, statusCode: 200, message: "Success", data: {} };

beforeEach(() => {
  jest.mocked(apiClient.get).mockReset().mockResolvedValue(SUCCESS);
  jest.mocked(apiClient.post).mockReset().mockResolvedValue(SUCCESS);
});

describe("loginRequest", () => {
  it("POSTs the credentials to OUR login route (not straight to the remote API)", async () => {
    await loginRequest({ username: "emilys", password: "emilyspass" });

    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/login", {
      isLocal: true,
      body: { username: "emilys", password: "emilyspass" },
    });
  });

  it("returns what the client returns", async () => {
    expect(await loginRequest({ username: "a", password: "bbbbbb" })).toBe(SUCCESS);
  });
});

describe("logoutRequest", () => {
  it("POSTs to the local logout route", async () => {
    await logoutRequest();

    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/logout", { isLocal: true });
  });
});

describe("fetchCurrentUser", () => {
  it("GETs the local current-user route", async () => {
    await fetchCurrentUser();

    expect(apiClient.get).toHaveBeenCalledWith("/api/auth/get-current-user", {
      isLocal: true,
      signal: undefined,
    });
  });

  it("passes the abort signal along", async () => {
    const controller = new AbortController();

    await fetchCurrentUser(controller.signal);

    expect(apiClient.get).toHaveBeenCalledWith(
      "/api/auth/get-current-user",
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
