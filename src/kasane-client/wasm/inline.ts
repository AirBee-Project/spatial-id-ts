import { decodeBase64 } from "../../internal/base64.js";
import init, { Kasane } from "./gen/kasane.js";
import wasm from "./gen/kasane_bg.base64.js";

let loading: Promise<unknown> | undefined;

/**
 * Wasm を読み込み（初回だけ）、データが空の Kasane を作る。
 *
 * バイナリを base64 で埋め込んでいるので、ファイルの場所を解決できない環境でも動く。
 */
export async function createKasane(): Promise<Kasane> {
  loading ??= init({ module_or_path: decodeBase64(wasm) });
  await loading;
  return new Kasane();
}
