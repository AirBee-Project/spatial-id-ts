/**
 * Kasane への接続。
 *
 * {@link KasaneClient.connect} で Kasane サーバーへ、{@link KasaneClient.inMemory} でプロセス内のインメモリの Kasane へつなぐ。
 * 通信に失敗したときは、`is*Error` で原因を判定する。
 *
 * ```ts
 * const client = await KasaneClient.connect("http://localhost:5172", "root", "password");
 * const local = await KasaneClient.inMemory();
 * ```
 *
 * @disableGroups
 * @sortStrategy documents-first
 * @module
 */

// biome-ignore assist/source/organizeImports: @sortStrategy documents-first はドキュメント以外を並べ替えないので、docs はこの export の順に並ぶ
export { KasaneClient } from "./client.js";
export type { RpcCallOptions } from "./options.js";
export {
  isConnectError,
  isNotFoundError,
  isAlreadyExistsError,
  isPermissionDeniedError,
  isUnauthenticatedError,
} from "./errors.js";
