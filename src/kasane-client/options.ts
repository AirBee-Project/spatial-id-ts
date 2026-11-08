import type { CallOptions } from "@connectrpc/connect";

/**
 * 呼び出し1回ごとの通信オプション。
 *
 * search / query / listTables / listDatabases がこれを受け取れるため、
 * 呼び出し側は「途中でやめる」「ヘッダを足す」を統一した形で指定できる。
 */
export interface RpcCallOptions {
  /**
   * 中断用のシグナル。abort すると進行中の通信そのものが打ち切られる。
   * ストリーミングでは受信を途中でやめても通信は止まらないため、中断にはこのシグナルが必要になる。
   */
  signal?: AbortSignal | undefined;
  /**
   * リクエストに付与する追加ヘッダ。
   * 分散トレースの `traceparent` を伝播させる場合などに使う。
   */
  headers?: HeadersInit | undefined;
}

/**
 * {@link RpcCallOptions} を Connect の {@link CallOptions} へ変換する。
 * 何も指定が無ければ `undefined` を返し、余分なオブジェクトを作らない。
 */
export function toCallOptions(
  options?: RpcCallOptions,
): CallOptions | undefined {
  if (!options) {
    return undefined;
  }
  const { signal, headers } = options;
  if (signal === undefined && headers === undefined) {
    return undefined;
  }
  // exactOptionalPropertyTypes が有効なので、未指定のキーは生やさない
  return {
    ...(signal !== undefined ? { signal } : {}),
    ...(headers !== undefined ? { headers } : {}),
  };
}
