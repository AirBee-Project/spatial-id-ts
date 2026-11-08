import {
  Code,
  ConnectError,
  createClient,
  createRouterTransport,
} from "@connectrpc/connect";
import { describe, expect, it } from "vitest";
import { AuthService } from "../proto/gen/auth_pb.js";
import { DatabaseService } from "../proto/gen/database_pb.js";
import { createAuthInterceptor } from "./auth.js";

describe("createAuthInterceptor", () => {
  it("ログインが Unauthenticated のときは再認証せずに失敗する", async () => {
    let logins = 0;
    let token: string | undefined;
    const transport = createRouterTransport(
      ({ service }) => {
        service(AuthService, {
          login() {
            logins++;
            // 再認証を繰り返す実装でもテストが返るように、数回で打ち切る。
            if (logins > 3) throw new ConnectError("loop", Code.Internal);
            throw new ConnectError("wrong password", Code.Unauthenticated);
          },
        });
      },
      {
        transport: {
          interceptors: [
            createAuthInterceptor({
              getToken: () => token,
              refreshToken: async () => {
                token = (await auth.login({})).token;
                return token;
              },
            }),
          ],
        },
      },
    );
    const auth = createClient(AuthService, transport);

    const err = await auth.login({}).catch((e) => e);
    expect(err).toBeInstanceOf(ConnectError);
    expect(err.code).toBe(Code.Unauthenticated);
    expect(logins).toBe(1);
  });

  it("ほかのサービスが Unauthenticated のときは再認証して 1 回だけ再試行する", async () => {
    const seen: (string | null)[] = [];
    const transport = createRouterTransport(
      ({ service }) => {
        service(DatabaseService, {
          list(_req, ctx) {
            const header = ctx.requestHeader.get("Authorization");
            seen.push(header);
            if (header !== "Bearer new") {
              throw new ConnectError("expired", Code.Unauthenticated);
            }
            return { databases: [] };
          },
        });
      },
      {
        transport: {
          interceptors: [
            createAuthInterceptor({
              getToken: () => "old",
              refreshToken: async () => "new",
            }),
          ],
        },
      },
    );

    await createClient(DatabaseService, transport).list({});
    expect(seen).toEqual(["Bearer old", "Bearer new"]);
  });
});
