import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";

import { MOCK_USER } from "@/features/tasks/__tests__/_mocks_/mock-data";
import { authKeys } from "@/lib/queries/query-keys";
import { createQueryTestSetup } from "@/lib/test-utils/query-wrapper";

import { fetchCurrentUser, loginRequest, logoutRequest } from "../../api/client";
import { useCurrentUser } from "../use-current-user";
import { useLogin } from "../use-login";
import { useLogout } from "../use-logout";

jest.mock("../../api/client", () => ({
  loginRequest: jest.fn(),
  logoutRequest: jest.fn(),
  fetchCurrentUser: jest.fn(),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const ok = <T,>(data: T) => ({ status: true, statusCode: 200, message: "Success", data });
const failed = (statusCode: number, message: string) => ({
  status: false,
  statusCode,
  message,
  data: null,
});

const CREDENTIALS = { username: "emilys", password: "emilyspass" };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useLogin", () => {
  it("sends the credentials", async () => {
    jest.mocked(loginRequest).mockResolvedValue(ok(MOCK_USER));
    const { Wrapper } = createQueryTestSetup();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(CREDENTIALS);
    });

    expect(loginRequest).toHaveBeenCalledWith(CREDENTIALS);
  });

  it("puts the user in the cache and welcomes them by name", async () => {
    jest.mocked(loginRequest).mockResolvedValue(ok(MOCK_USER));
    const { Wrapper, queryClient } = createQueryTestSetup();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(CREDENTIALS);
    });

    expect(queryClient.getQueryData(authKeys.currentUser())).toEqual(MOCK_USER);
    expect(toast.success).toHaveBeenCalledWith("Welcome back, Emily!");
  });

  it("shows the server's message in a toast when login fails, and caches nothing", async () => {
    jest.mocked(loginRequest).mockResolvedValue(failed(400, "Invalid credentials"));
    const { Wrapper, queryClient } = createQueryTestSetup();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(CREDENTIALS)).rejects.toThrow("Invalid credentials");
    });

    expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    expect(toast.success).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(authKeys.currentUser())).toBeUndefined();
  });
});

describe("useLogout", () => {
  it("calls the logout route and shows a toast", async () => {
    jest.mocked(logoutRequest).mockResolvedValue(ok({ isLoggedOut: true }));
    const { Wrapper } = createQueryTestSetup();
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(logoutRequest).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Logged out");
  });

  it("clears EVERYTHING cached, so the next user never sees the previous user's data", async () => {
    jest.mocked(logoutRequest).mockResolvedValue(ok({ isLoggedOut: true }));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(authKeys.currentUser(), MOCK_USER);
    queryClient.setQueryData(["tasks", "list"], [{ id: 1 }]);
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(authKeys.currentUser())).toBeUndefined();
    expect(queryClient.getQueryData(["tasks", "list"])).toBeUndefined();
  });

  it("shows an error toast and keeps the cache when logout fails", async () => {
    jest.mocked(logoutRequest).mockResolvedValue(failed(502, "Network error"));
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(authKeys.currentUser(), MOCK_USER);
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow("Network error");
    });

    expect(toast.error).toHaveBeenCalledWith("Network error");
    expect(queryClient.getQueryData(authKeys.currentUser())).toEqual(MOCK_USER);
  });
});

describe("useCurrentUser", () => {
  it("returns the user already in the cache without a request (server hydration)", () => {
    const { Wrapper, queryClient } = createQueryTestSetup();
    queryClient.setQueryData(authKeys.currentUser(), MOCK_USER);

    const { result } = renderHook(() => useCurrentUser(), { wrapper: Wrapper });

    expect(result.current.data).toEqual(MOCK_USER);
    expect(fetchCurrentUser).not.toHaveBeenCalled();
  });

  it("fetches the user when the cache is empty", async () => {
    jest.mocked(fetchCurrentUser).mockResolvedValue(ok(MOCK_USER));
    const { Wrapper } = createQueryTestSetup();

    const { result } = renderHook(() => useCurrentUser(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_USER);
  });

  it("reports an error when the user is not authenticated", async () => {
    jest.mocked(fetchCurrentUser).mockResolvedValue(failed(401, "Not authenticated"));
    const { Wrapper } = createQueryTestSetup();

    const { result } = renderHook(() => useCurrentUser(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Not authenticated");
  });
});
