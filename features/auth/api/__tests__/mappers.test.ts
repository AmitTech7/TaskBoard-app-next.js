import { MOCK_REMOTE_USER, MOCK_USER } from "@/features/tasks/__tests__/_mocks_/mock-data";

import { mapRemoteUser } from "../mappers";

describe("mapRemoteUser", () => {
  it("keeps only the safe fields", () => {
    expect(mapRemoteUser(MOCK_REMOTE_USER)).toEqual(MOCK_USER);
  });

  it("NEVER lets the plaintext password through (DummyJSON returns it)", () => {
    const mapped = mapRemoteUser(MOCK_REMOTE_USER);

    expect(mapped).not.toHaveProperty("password");
    expect(JSON.stringify(mapped)).not.toContain(MOCK_REMOTE_USER.password);
  });

  it("drops every field we did not ask for", () => {
    const remote = { ...MOCK_REMOTE_USER, ssn: "123", token: "abc" };
    const mapped = mapRemoteUser(remote);

    expect(Object.keys(mapped).sort()).toEqual([
      "email",
      "firstName",
      "id",
      "image",
      "lastName",
      "username",
    ]);
  });
});
