import {
  Code,
  ConnectError,
  createClient,
  createRouterTransport,
} from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { describe, expect, it } from "vitest";
import { DatabaseService } from "../proto/gen/database_pb.js";
import { FailoverTransport } from "./failoverTransport.js";

const healthy = createRouterTransport(({ service }) => {
  service(DatabaseService, { list: () => ({ databases: [] }) });
});

describe("FailoverTransport", () => {
  it("接続を拒否されたサーバーを飛ばして次のサーバーを使う", async () => {
    // ポート 1 は待ち受けがないので、fetch が接続の拒否で失敗する。
    const refused = createGrpcWebTransport({ baseUrl: "http://127.0.0.1:1" });
    const client = createClient(
      DatabaseService,
      new FailoverTransport([refused, healthy]),
    );

    expect(await client.list({})).toMatchObject({ databases: [] });
  });

  it("サーバーが返したエラーでは切り替えない", async () => {
    const denied = createRouterTransport(({ service }) => {
      service(DatabaseService, {
        list() {
          throw new ConnectError("denied", Code.PermissionDenied);
        },
      });
    });
    const client = createClient(
      DatabaseService,
      new FailoverTransport([denied, healthy]),
    );

    const err = await client.list({}).catch((e) => e);
    expect(err.code).toBe(Code.PermissionDenied);
  });
});
