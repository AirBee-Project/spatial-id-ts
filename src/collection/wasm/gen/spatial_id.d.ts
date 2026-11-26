/* tslint:disable */
/* eslint-disable */

export class Query {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * `kind` は 0 が intersection、1 が difference。左側の値を残すので、右側の値は左側の型の値に置き換えてから重ねる。
     */
    binary(kind: number): void;
    /**
     * `axis` は 0 が F、1 が X、2 が Y。
     */
    extrude(axis: number, z: number, start: number, end: number, policy: number): void;
    /**
     * `axis` は 0 が F、1 が X、2 が Y。`direction` は 0 が座標の小さい側、1 が大きい側で、省くと両側。
     */
    falloff(axis: number, z: number, radius: number, direction: number | null | undefined, pattern: number, policy: number): void;
    /**
     * `kind` は 0 が `start` と等しい値、1 が `[start, end)` に入る値、2 が `[start, end)` の外の値を残す。
     * 範囲の `start` と `end` を省くと、その側に端を設けない。
     */
    filterNumbers(kind: number, start?: number | null, end?: number | null): void;
    /**
     * `targets` の中にある部分を `[ID の数値列, 値の配列]` で返す。`targets` を省くと全体を返す。
     *
     * `overlapping` のとき `targets` で切り取らず、`flex` のとき ID を FlexId の数値列で返す。
     */
    get(targets: Float64Array | number[] | null | undefined, overlapping: boolean, flex: boolean): [Float64Array, unknown[]];
    /**
     * 積んだ2つを `policy` で重ね合わせる。
     */
    merge(policy: number): void;
    constructor();
    pushMap(map: SpatialIdMap): void;
    pushSet(set: SpatialIdSet): void;
    shift(z: number, f: number, x: number, y: number): void;
    toMap(): SpatialIdMap;
    toSet(): SpatialIdSet;
    /**
     * `kind` は 0 が filter、1 が map、2 が filterMap。filterMap は `undefined` を返した要素を取り除く。
     *
     * `withId` のとき `f` は `(flexId, value)`、そうでなければ `(value)` を受け取る。
     * `flexId` は `[fz, f, xz, x, yz, y, tz, t]` の数値列。
     */
    transform(kind: number, with_id: boolean, f: Function): void;
    validate(): void;
    zoomOut(z: number, policy: number): void;
}

/**
 * 値は JS のプリミティブ（`number | string | boolean | null | undefined`）を保持し、JS の `===` で比べる。
 */
export class SpatialIdMap {
    free(): void;
    [Symbol.dispose](): void;
    clear(): void;
    count(): number;
    difference(other: SpatialIdMap): SpatialIdMap;
    entries(): [Float64Array, unknown[]];
    flatSingleIds(allowed_intervals?: Float64Array | number[] | null): [Float64Array, unknown[]];
    flexEntries(): [Float64Array, unknown[]];
    getFlexIds(id: Float64Array | number[]): [Float64Array, unknown[]];
    getOverlappingFlexIds(id: Float64Array | number[]): [Float64Array, unknown[]];
    getOverlapping(id: Float64Array | number[]): [Float64Array, unknown[]];
    get(id: Float64Array | number[]): [Float64Array, unknown[]];
    insert(id: Float64Array | number[], value: unknown): void;
    intersection(other: SpatialIdMap): SpatialIdMap;
    isEmpty(): boolean;
    constructor();
    reconstructedTimeRanges(allowed_intervals?: Float64Array | number[] | null): [Float64Array, unknown[]];
    removeFlexIds(id: Float64Array | number[]): [Float64Array, unknown[]];
    removeOverlappingFlexIds(id: Float64Array | number[]): [Float64Array, unknown[]];
    removeOverlapping(id: Float64Array | number[]): [Float64Array, unknown[]];
    remove(id: Float64Array | number[]): [Float64Array, unknown[]];
    spatialFaceNeighborsFlexIds(id: Float64Array | number[]): [Float64Array, unknown[]];
    spatialFaceNeighbors(id: Float64Array | number[]): [Float64Array, unknown[]];
    union(other: SpatialIdMap): SpatialIdMap;
}

export class SpatialIdSet {
    free(): void;
    [Symbol.dispose](): void;
    clear(): void;
    count(): number;
    difference(other: SpatialIdSet): SpatialIdSet;
    flatSingleIds(allowed_intervals?: Float64Array | number[] | null): Float64Array;
    flexIds(): Float64Array;
    static fromMap(map: SpatialIdMap): SpatialIdSet;
    getFlexIds(id: Float64Array | number[]): Float64Array;
    getOverlappingFlexIds(id: Float64Array | number[]): Float64Array;
    getOverlapping(id: Float64Array | number[]): Float64Array;
    get(id: Float64Array | number[]): Float64Array;
    ids(): Float64Array;
    insert(id: Float64Array | number[]): void;
    intersection(other: SpatialIdSet): SpatialIdSet;
    isEmpty(): boolean;
    constructor();
    reconstructedTimeRanges(allowed_intervals?: Float64Array | number[] | null): Float64Array;
    removeFlexIds(id: Float64Array | number[]): Float64Array;
    removeOverlappingFlexIds(id: Float64Array | number[]): Float64Array;
    removeOverlapping(id: Float64Array | number[]): Float64Array;
    remove(id: Float64Array | number[]): Float64Array;
    spatialFaceNeighborsFlexIds(id: Float64Array | number[]): Float64Array;
    spatialFaceNeighbors(id: Float64Array | number[]): Float64Array;
    union(other: SpatialIdSet): SpatialIdSet;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_query_free: (a: number, b: number) => void;
    readonly __wbg_spatialidmap_free: (a: number, b: number) => void;
    readonly __wbg_spatialidset_free: (a: number, b: number) => void;
    readonly query_binary: (a: number, b: number) => [number, number];
    readonly query_extrude: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly query_falloff: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly query_filterNumbers: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly query_get: (a: number, b: number, c: number, d: number, e: number) => [number, number, number];
    readonly query_merge: (a: number, b: number) => [number, number];
    readonly query_new: () => number;
    readonly query_pushMap: (a: number, b: number) => void;
    readonly query_pushSet: (a: number, b: number) => void;
    readonly query_shift: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly query_toMap: (a: number) => [number, number, number];
    readonly query_toSet: (a: number) => [number, number, number];
    readonly query_transform: (a: number, b: number, c: number, d: any) => [number, number];
    readonly query_validate: (a: number) => [number, number];
    readonly query_zoomOut: (a: number, b: number, c: number) => [number, number];
    readonly spatialidmap_clear: (a: number) => void;
    readonly spatialidmap_count: (a: number) => number;
    readonly spatialidmap_difference: (a: number, b: number) => number;
    readonly spatialidmap_entries: (a: number) => any;
    readonly spatialidmap_flatSingleIds: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_flexEntries: (a: number) => any;
    readonly spatialidmap_get: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_getFlexIds: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_getOverlapping: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_getOverlappingFlexIds: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_insert: (a: number, b: number, c: number, d: any) => [number, number];
    readonly spatialidmap_intersection: (a: number, b: number) => number;
    readonly spatialidmap_isEmpty: (a: number) => number;
    readonly spatialidmap_new: () => number;
    readonly spatialidmap_reconstructedTimeRanges: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_remove: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_removeFlexIds: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_removeOverlapping: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_removeOverlappingFlexIds: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_spatialFaceNeighbors: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_spatialFaceNeighborsFlexIds: (a: number, b: number, c: number) => [number, number, number];
    readonly spatialidmap_union: (a: number, b: number) => number;
    readonly spatialidset_clear: (a: number) => void;
    readonly spatialidset_count: (a: number) => number;
    readonly spatialidset_difference: (a: number, b: number) => number;
    readonly spatialidset_flatSingleIds: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_flexIds: (a: number) => [number, number];
    readonly spatialidset_fromMap: (a: number) => number;
    readonly spatialidset_get: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_getFlexIds: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_getOverlapping: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_getOverlappingFlexIds: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_ids: (a: number) => [number, number];
    readonly spatialidset_insert: (a: number, b: number, c: number) => [number, number];
    readonly spatialidset_intersection: (a: number, b: number) => number;
    readonly spatialidset_isEmpty: (a: number) => number;
    readonly spatialidset_new: () => number;
    readonly spatialidset_reconstructedTimeRanges: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_remove: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_removeFlexIds: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_removeOverlapping: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_removeOverlappingFlexIds: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_spatialFaceNeighbors: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_spatialFaceNeighborsFlexIds: (a: number, b: number, c: number) => [number, number, number, number];
    readonly spatialidset_union: (a: number, b: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
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
