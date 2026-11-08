/**
 * データベースとテーブルの操作。
 *
 * {@link kasane-client!KasaneClient.database} で {@link DatabaseHandle} を、{@link DatabaseHandle.table} で {@link TableHandle} を得て操作する。
 *
 * ```ts
 * const db = client.database("city");
 * await db.createTable("population", "int", 20);
 *
 * const table = db.table<number>("population");
 * await table.insert(120, SingleId.create(20, 0, 931277, 412899));
 * ```
 *
 * @disableGroups
 * @sortStrategy documents-first
 * @module
 */

// biome-ignore assist/source/organizeImports: @sortStrategy documents-first はドキュメント以外を並べ替えないので、docs はこの export の順に並ぶ
export { DatabaseHandle, TableHandle } from "./handle.js";
export type {
  TableInfo,
  TableDataType,
  PrimitiveValue,
  ZoomLevelPolicy,
} from "./types.js";
export type { DatabaseInfo } from "../../proto/gen/database_pb.js";
export type { TableConstraints } from "../../proto/gen/common_pb.js";
