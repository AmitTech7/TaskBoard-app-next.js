/**
 * @jest-environment node
 */
// ^ NextResponse needs the real Request/Response classes, which jsdom doesn't have.
import { respond } from "../route-response";
import type { ApiResult } from "../types";

function result(status: boolean, statusCode: number): ApiResult<{ ok: boolean }> {
  return { status, statusCode, message: "m", data: status ? { ok: true } : null };
}

describe("respond", () => {
  it("sends the result as JSON body", async () => {
    const response = respond(result(true, 200));

    expect(await response.json()).toEqual(result(true, 200));
  });

  it.each([200, 201, 202])("keeps a successful status %p", (code) => {
    expect(respond(result(true, code)).status).toBe(code);
  });

  it.each([0, 101, 600])(
    "answers 200 when a success carries an invalid status code (%p)",
    (code) => {
      expect(respond(result(true, code)).status).toBe(200);
    },
  );

  it.each([204, 205, 304])(
    "answers 200 instead of %p, because that status can't carry the JSON body (it would throw)",
    async (code) => {
      const response = respond(result(true, code));

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ status: true });
    },
  );

  it.each([400, 401, 404, 500, 503])("keeps a failure status %p", (code) => {
    expect(respond(result(false, code)).status).toBe(code);
  });

  it("answers 502 for 'no response' failures (statusCode 0)", () => {
    expect(respond(result(false, 0)).status).toBe(502);
  });

  it.each([200, 201, 302])("never sends a failure as %p (2xx/3xx)", (code) => {
    expect(respond(result(false, code)).status).toBe(502);
  });

  it("answers 502 for a failure with an out-of-range status", () => {
    expect(respond(result(false, 999)).status).toBe(502);
  });
});
