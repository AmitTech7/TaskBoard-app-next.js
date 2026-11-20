import type { CurrentUser, RemoteUser } from "../types";

/**
 * Picks ONLY the fields we need. This is a security step, not just tidiness: DummyJSON's
 * /auth/me returns the user's plaintext password, and copying fields one by one guarantees
 * it can never reach the browser.
 */
export function mapRemoteUser(remote: RemoteUser): CurrentUser {
  return {
    id: remote.id,
    username: remote.username,
    email: remote.email,
    firstName: remote.firstName,
    lastName: remote.lastName,
    image: remote.image,
  };
}
