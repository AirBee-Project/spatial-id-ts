import { describe, expect, it } from "vitest";
import { SingleId } from "../spatial-id/singleId.js";
import { KasaneClient } from "./client.js";
import { isAlreadyExistsError, isNotFoundError } from "./errors.js";

describe("KasaneClient.inMemory", () => {
  it("作成・書き込み・検索・件数が Wasm 上の Kasane で動く", async () => {
    const client = await KasaneClient.inMemory();
    await client.createDatabase("db");
    const db = client.database("db");
    await db.createTable("risk", "int", 20);

    const table = db.table<number>("risk");
    const id = SingleId.create(20, 0, 100, 200);
    await table.insert(10, id);

    const found = [];
    for await (const item of table.search(id)) {
      found.push(item);
    }
    expect(found.map((item) => item.value)).toEqual([10]);
    expect((await table.info()).count).toBe(1);
    expect((await db.listTables()).map((t) => t.count)).toEqual([1]);
  });

  it("エラーは gRPC のコードを保ったまま ConnectError になる", async () => {
    const client = await KasaneClient.inMemory();
    await client.createDatabase("db");

    const duplicated = await client.createDatabase("db").catch((e) => e);
    expect(isAlreadyExistsError(duplicated)).toBe(true);

    const missing = await client
      .database("missing")
      .info()
      .catch((e) => e);
    expect(isNotFoundError(missing)).toBe(true);
  });

  it("インスタンスごとにデータが独立している", async () => {
    const a = await KasaneClient.inMemory();
    const b = await KasaneClient.inMemory();
    await a.createDatabase("only_in_a");

    expect(await b.listDatabases()).toEqual([]);
  });
});
