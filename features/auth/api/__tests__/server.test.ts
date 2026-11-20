import { cookies } from "next/headers";

import { MOCK_REMOTE_USER, MOCK_USER } from "@/features/tasks/__tests__/_mocks_/mock-data";
import { fetchServer } from "@/lib/api/server";

import { getCurrentUser, loginWithCredentials } from "../server";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/lib/api/server", () => ({ fetchServer: jest.fn() }));

function mockCookie(value: string | undefined) {
  jest.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === "auth_token" && value !== undefined ? { name, value } : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

beforeEach(() => {
  jest.mocked(fetchServer).mockReset();
  jest.mocked(cookies).mockReset();
});

describe("getCurrentUser", () => {
  it("returns null without calling the API when there is no cookie", async () => {
    mockCookie(undefined);

    expect(await getCurrentUser()).toBeNull();
    expect(fetchServer).not.toHaveBeenCalled();
  });

  it("sends the cookie's token to /auth/me", async () => {
    mockCookie("the-token");
    jest.mocked(fetchServer).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: MOCK_REMOTE_USER,
    });

    await getCurrentUser();

    expect(fetchServer).toHaveBeenCalledWith("/auth/me", { token: "the-token" });
  });

  it("returns the safe user, without the password", async () => {
    mockCookie("the-token");
    jest.mocked(fetchServer).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: MOCK_REMOTE_USER,
    });

    const user = await getCurrentUser();

    expect(user).toEqual(MOCK_USER);
    expect(user).not.toHaveProperty("password");
  });

  it("returns null when the token is rejected (expired or invalid)", async () => {
    mockCookie("old-token");
    jest.mocked(fetchServer).mockResolvedValue({
      status: false,
      statusCode: 401,
      message: "Invalid/Expired Token!",
      data: null,
    });

    expect(await getCurrentUser()).toBeNull();
  });

  it("returns null when the API says success but sends no user", async () => {
    mockCookie("the-token");
    jest.mocked(fetchServer).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: null,
    });

    expect(await getCurrentUser()).toBeNull();
  });
});

describe("loginWithCredentials", () => {
  const credentials = { username: "emilys", password: "emilyspass" };

  it("POSTs the credentials with a token lifetime that matches the cookie", async () => {
    jest.mocked(fetchServer).mockResolvedValue({
      status: false,
      statusCode: 400,
      message: "x",
      data: null,
    });

    await loginWithCredentials(credentials);

    expect(fetchServer).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { ...credentials, expiresInMins: 60 },
    });
  });

  it("returns the safe user and the access token", async () => {
    jest.mocked(fetchServer).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: { ...MOCK_REMOTE_USER, accessToken: "access-123", refreshToken: "refresh-456" },
    });

    const result = await loginWithCredentials(credentials);

    expect(result.data).toEqual({ user: MOCK_USER, token: "access-123" });
  });

  it("never exposes the password or the refresh token", async () => {
    jest.mocked(fetchServer).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: { ...MOCK_REMOTE_USER, accessToken: "access-123", refreshToken: "refresh-456" },
    });

    const serialised = JSON.stringify(await loginWithCredentials(credentials));

    expect(serialised).not.toContain("refresh-456");
    expect(serialised).not.toContain(MOCK_REMOTE_USER.password);
  });

  it("passes a failure through unchanged, with no data", async () => {
    jest.mocked(fetchServer).mockResolvedValue({
      status: false,
      statusCode: 400,
      message: "Invalid credentials",
      data: null,
    });

    expect(await loginWithCredentials(credentials)).toEqual({
      status: false,
      statusCode: 400,
      message: "Invalid credentials",
      data: null,
    });
  });

  it("treats success-without-data as a failure", async () => {
    jest.mocked(fetchServer).mockResolvedValue({
      status: true,
      statusCode: 200,
      message: "Success",
      data: null,
    });

    expect((await loginWithCredentials(credentials)).data).toBeNull();
  });
});
