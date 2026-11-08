import { describe, expect, it } from "vitest";
import { RangeId } from "../spatial-id/rangeId.js";
import { SingleId } from "../spatial-id/singleId.js";
import { KasaneClient } from "./client.js";
import {
  isAlreadyExistsError,
  isNotFoundError,
  isUnauthenticatedError,
} from "./errors.js";
import { type QueryBuilder, query } from "./query/builder.js";

// LMDB 版の Kasane サーバー（root / password）を立てて、KASANE_URL に grpc-web の URL を渡したときだけ動く。
const url = (globalThis as { process?: { env: { KASANE_URL?: string } } })
  .process?.env.KASANE_URL;

const sorted = (items: { id: unknown; value: unknown }[]) =>
  items.map((i) => `${String(i.id)}=${String(i.value)}`).sort();

async function scenario(client: KasaneClient, db: string) {
  const out = new Map<string, unknown>();
  out.set("created", (await client.createDatabase(db, "desc")).name);
  out.set(
    "duplicated",
    isAlreadyExistsError(await client.createDatabase(db).catch((e) => e)),
  );
  out.set(
    "listed",
    (await client.listDatabases()).some((d) => d.name === db),
  );

  const handle = client.database(db);
  out.set(
    "updated",
    (await handle.update({ description: "desc2" })).description,
  );
  out.set("tableCreated", await handle.createTable("risk", "int", 20));
  await handle.createTable("label", "text", 20);

  const risk = handle.table<number>("risk");
  const a = SingleId.create(20, 0, 100, 200);
  const b = SingleId.create(20, 0, 101, 200);
  const c = SingleId.create(20, 0, 102, 200);
  const range = RangeId.create(20, [0, 0], [100, 102], [200, 200]);
  await risk.insert(10, [a, b]);
  await risk.upsert(20, c);
  out.set("search", sorted(await risk.search(range).toArray()));
  out.set(
    "searchRange",
    sorted(await risk.search(range, { format: "rangeId" }).toArray()),
  );
  out.set(
    "zoomError",
    await risk
      .search(SingleId.create(21, 0, 200, 400), { policy: "error" })
      .toArray()
      .then(
        () => "ok",
        (e) => e.code,
      ),
  );
  out.set("info", await risk.info());

  await handle.table<string>("label").insert("hello", a);
  out.set("text", sorted(await handle.table("label").search(a).toArray()));

  const run = async (q: QueryBuilder) =>
    sorted(
      await client
        .query(q, RangeId.create(20, [0, 0], [99, 103], [199, 201]))
        .toArray(),
    );
  const source = () => query.source(db, "risk");
  out.set("querySource", await run(source()));
  out.set("queryFilter", await run(source().filter({ min: 15n })));
  out.set("queryAdd", await run(source().add(5)));
  out.set("queryShift", await run(source().shiftX(20, 1)));
  out.set(
    "queryMap",
    await run(
      source().mapValues({
        outputType: "text",
        mapping: [{ from: 10n, to: "low" }],
        defaultValue: "high",
      }),
    ),
  );
  out.set(
    "queryDifference",
    await run(source().difference(source().filter({ equals: 20n }))),
  );
  out.set("queryZoomOut", await run(source().zoomOut(19, "max")));

  await risk.remove(b);
  out.set("removed", sorted(await risk.search(range).toArray()));
  await handle.table("label").delete();
  out.set(
    "tables",
    (await handle.listTables()).map((t) => `${t.name}:${t.count}`),
  );
  await handle.delete();
  out.set("deleted", isNotFoundError(await handle.info().catch((e) => e)));
  return Object.fromEntries(out);
}

describe.skipIf(url === undefined)("LMDB 版の Kasane サーバー", () => {
  const server = url as string;

  it("Wasm 版と同じ操作で同じ結果になる", async () => {
    const db = `client_test_${Date.now()}`;
    const fromServer = await scenario(
      await KasaneClient.connect(server, "root", "password"),
      db,
    );
    const fromWasm = await scenario(await KasaneClient.inMemory(), db);
    expect(fromWasm).toEqual(fromServer);
  });

  it("パスワードが違うと Unauthenticated で失敗する", async () => {
    const err = await KasaneClient.connect(server, "root", "wrong").catch(
      (e) => e,
    );
    expect(isUnauthenticatedError(err)).toBe(true);
  });

  it("接続できないサーバーを飛ばして次のサーバーにつなぐ", async () => {
    const client = await KasaneClient.connect(
      ["http://127.0.0.1:1", server],
      "root",
      "password",
    );
    expect(Array.isArray(await client.listDatabases())).toBe(true);
  });
});
