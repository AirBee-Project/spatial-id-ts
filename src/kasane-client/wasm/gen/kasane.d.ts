/* tslint:disable */
/* eslint-disable */

/**
 * データはインスタンスごとに独立して持つ。利用者は root 固定。
 */
export class Kasane {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * `method` は `/kasane.TableService/Create` の形。成功すると応答メッセージ（protobuf）の配列を返す。
     * unary は 1 件、server streaming はチャンクの数だけ並ぶ。
     *
     * 失敗すると、`code`（gRPC のコード番号）と `reason`（ErrorInfo の reason）を持つ `Error` を throw する。
     */
    handle(method: string, request: Uint8Array): Uint8Array[];
    constructor();
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_kasane_free: (a: number, b: number) => void;
    readonly kasane_handle: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
    readonly kasane_new: () => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __externref_drop_slice: (a: number, b: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
