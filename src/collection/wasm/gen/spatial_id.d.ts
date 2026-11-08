/* tslint:disable */
/* eslint-disable */

/**
 * 値は JS の `===` で比べる（`JsValue` の `PartialEq`）。
 */
export class SpatialIdMap {
    free(): void;
    [Symbol.dispose](): void;
    clear(): void;
    count(): number;
    difference(other: SpatialIdMap): SpatialIdMap;
    entries(): [Float64Array, unknown[]];
    flatSingleIds(allowed_intervals?: Float64Array | null): [Float64Array, unknown[]];
    flexEntries(): [Float64Array, unknown[]];
    getFlexIds(id: Float64Array): [Float64Array, unknown[]];
    getOverlappingFlexIds(id: Float64Array): [Float64Array, unknown[]];
    getOverlapping(id: Float64Array): [Float64Array, unknown[]];
    get(id: Float64Array): [Float64Array, unknown[]];
    insert(id: Float64Array, value: unknown): void;
    intersection(other: SpatialIdMap): SpatialIdMap;
    isEmpty(): boolean;
    constructor();
    reconstructedTimeRanges(allowed_intervals?: Float64Array | null): [Float64Array, unknown[]];
    removeFlexIds(id: Float64Array): [Float64Array, unknown[]];
    removeOverlappingFlexIds(id: Float64Array): [Float64Array, unknown[]];
    removeOverlapping(id: Float64Array): [Float64Array, unknown[]];
    remove(id: Float64Array): [Float64Array, unknown[]];
    spatialFaceNeighborsFlexIds(id: Float64Array): [Float64Array, unknown[]];
    spatialFaceNeighbors(id: Float64Array): [Float64Array, unknown[]];
    union(other: SpatialIdMap): SpatialIdMap;
}

export class SpatialIdSet {
    free(): void;
    [Symbol.dispose](): void;
    clear(): void;
    count(): number;
    difference(other: SpatialIdSet): SpatialIdSet;
    flatSingleIds(allowed_intervals?: Float64Array | null): Float64Array;
    flexIds(): Float64Array;
    static fromMap(map: SpatialIdMap): SpatialIdSet;
    getFlexIds(id: Float64Array): Float64Array;
    getOverlappingFlexIds(id: Float64Array): Float64Array;
    getOverlapping(id: Float64Array): Float64Array;
    get(id: Float64Array): Float64Array;
    ids(): Float64Array;
    insert(id: Float64Array): void;
    intersection(other: SpatialIdSet): SpatialIdSet;
    isEmpty(): boolean;
    constructor();
    reconstructedTimeRanges(allowed_intervals?: Float64Array | null): Float64Array;
    removeFlexIds(id: Float64Array): Float64Array;
    removeOverlappingFlexIds(id: Float64Array): Float64Array;
    removeOverlapping(id: Float64Array): Float64Array;
    remove(id: Float64Array): Float64Array;
    spatialFaceNeighborsFlexIds(id: Float64Array): Float64Array;
    spatialFaceNeighbors(id: Float64Array): Float64Array;
    union(other: SpatialIdSet): SpatialIdSet;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_spatialidmap_free: (a: number, b: number) => void;
    readonly __wbg_spatialidset_free: (a: number, b: number) => void;
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
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
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
