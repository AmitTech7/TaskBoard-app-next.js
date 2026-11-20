/** The user shape the whole app uses. Deliberately has NO password or tokens. */
export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

/** What DummyJSON returns for a user. It has more fields (even a plaintext password); we only name what we read. */
export interface RemoteUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

/** What DummyJSON returns for POST /auth/login. */
export interface RemoteLoginResponse extends RemoteUser {
  accessToken: string;
  refreshToken: string;
}

/** What the server-side login function returns. The token never leaves the server. */
export interface LoginResult {
  user: CurrentUser;
  token: string;
}

export interface LogoutResult {
  isLoggedOut: boolean;
}
