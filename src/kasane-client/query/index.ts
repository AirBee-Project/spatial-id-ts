/**
 * 空間クエリの組み立て。
 *
 * {@link query.source} を起点に {@link QueryBuilder} のメソッドをつなげて組み立て、{@link kasane-client!KasaneClient.query} で実行する。
 *
 * ```ts
 * const q = query
 *   .source("city", "population")
 *   .filter({ min: 100 })
 *   .zoomOut(15, "sum");
 *
 * for await (const { id, value } of client.query(q, ids)) {
 *   console.log(`${id}`, value);
 * }
 * ```
 *
 * @disableGroups
 * @sortStrategy documents-first
 * @module
 */

// biome-ignore assist/source/organizeImports: @sortStrategy documents-first はドキュメント以外を並べ替えないので、docs はこの export の順に並ぶ
export { query, QueryBuilder } from "./builder.js";
export type {
  FilterConditionInput,
  MergePolicy,
  FalloffPattern,
  Direction,
} from "./types.js";
export type { QueryNode } from "../../proto/gen/query_pb.js";
