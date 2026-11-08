/**
 * 検索・クエリの結果。
 *
 * {@link "kasane-client/database"!TableHandle.search} と {@link kasane-client!KasaneClient.query} は {@link ResultStream} を返す。`for await` で {@link ResultItem} を1件ずつ受け取る。
 *
 * ```ts
 * for await (const { id, value } of table.search(ids, { format: "singleId" })) {
 *   console.log(`${id}`, value);
 * }
 * ```
 *
 * @disableGroups
 * @sortStrategy documents-first
 * @module
 */

// biome-ignore assist/source/organizeImports: @sortStrategy documents-first はドキュメント以外を並べ替えないので、docs はこの export の順に並ぶ
export { ResultStream, type ResultItem } from "./stream.js";
export type { OutputFormat } from "./types.js";
