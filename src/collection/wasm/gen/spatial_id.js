/* @ts-self-types="./spatial_id.d.ts" */

export class Query {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QueryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_query_free(ptr, 0);
    }
    /**
     * `kind` は 0 が intersection、1 が difference。左側の値を残すので、右側の値は左側の型の値に置き換えてから重ねる。
     * @param {number} kind
     */
    binary(kind) {
        const ret = wasm.query_binary(this.__wbg_ptr, kind);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * `axis` は 0 が F、1 が X、2 が Y。
     * @param {number} axis
     * @param {number} z
     * @param {number} start
     * @param {number} end
     * @param {number} policy
     */
    extrude(axis, z, start, end, policy) {
        const ret = wasm.query_extrude(this.__wbg_ptr, axis, z, start, end, policy);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * `axis` は 0 が F、1 が X、2 が Y。`direction` は 0 が座標の小さい側、1 が大きい側で、省くと両側。
     * @param {number} axis
     * @param {number} z
     * @param {number} radius
     * @param {number | null | undefined} direction
     * @param {number} pattern
     * @param {number} policy
     */
    falloff(axis, z, radius, direction, pattern, policy) {
        const ret = wasm.query_falloff(this.__wbg_ptr, axis, z, radius, isLikeNone(direction) ? 0xFFFFFF : direction, pattern, policy);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * `kind` は 0 が `start` と等しい値、1 が `[start, end)` に入る値、2 が `[start, end)` の外の値を残す。
     * 範囲の `start` と `end` を省くと、その側に端を設けない。
     * @param {number} kind
     * @param {number | null} [start]
     * @param {number | null} [end]
     */
    filterNumbers(kind, start, end) {
        const ret = wasm.query_filterNumbers(this.__wbg_ptr, kind, !isLikeNone(start), isLikeNone(start) ? 0 : start, !isLikeNone(end), isLikeNone(end) ? 0 : end);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * `targets` の中にある部分を `[ID の数値列, 値の配列]` で返す。`targets` を省くと全体を返す。
     *
     * `overlapping` のとき `targets` で切り取らず、`flex` のとき ID を FlexId の数値列で返す。
     * @param {Float64Array | number[] | null | undefined} targets
     * @param {boolean} overlapping
     * @param {boolean} flex
     * @returns {[Float64Array, unknown[]]}
     */
    get(targets, overlapping, flex) {
        const val2 = +overlapping;
        const val3 = +flex;
        let ptr, ptr0, len0;
        try {
            ptr = this.__destroy_into_raw();
            ptr0 = isLikeNone(targets) ? 0 : passArrayF64ToWasm0(targets, wasm.__wbindgen_malloc);
            len0 = WASM_VECTOR_LEN;
        } catch (e) {
            if (ptr0) { wasm.__wbindgen_free(ptr0, len0 * 8, 8); }
            if (ptr) wasm.__wbg_query_free(ptr, 1);
            throw e;
        }
        const ret = wasm.query_get(ptr, ptr0, len0, val2, val3);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * 積んだ2つを `policy` で重ね合わせる。
     * @param {number} policy
     */
    merge(policy) {
        const ret = wasm.query_merge(this.__wbg_ptr, policy);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    constructor() {
        const ret = wasm.query_new();
        this.__wbg_ptr = ret;
        QueryFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {SpatialIdMap} map
     */
    pushMap(map) {
        _assertClass(map, SpatialIdMap);
        wasm.query_pushMap(this.__wbg_ptr, map.__wbg_ptr);
    }
    /**
     * @param {SpatialIdSet} set
     */
    pushSet(set) {
        _assertClass(set, SpatialIdSet);
        wasm.query_pushSet(this.__wbg_ptr, set.__wbg_ptr);
    }
    /**
     * @param {number} z
     * @param {number} f
     * @param {number} x
     * @param {number} y
     */
    shift(z, f, x, y) {
        const ret = wasm.query_shift(this.__wbg_ptr, z, f, x, y);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {SpatialIdMap}
     */
    toMap() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.query_toMap(ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return SpatialIdMap.__wrap(ret[0]);
    }
    /**
     * @returns {SpatialIdSet}
     */
    toSet() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.query_toSet(ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return SpatialIdSet.__wrap(ret[0]);
    }
    /**
     * `kind` は 0 が filter、1 が map、2 が filterMap。filterMap は `undefined` を返した要素を取り除く。
     *
     * `withId` のとき `f` は `(flexId, value)`、そうでなければ `(value)` を受け取る。
     * `flexId` は `[fz, f, xz, x, yz, y, tz, t]` の数値列。
     * @param {number} kind
     * @param {boolean} with_id
     * @param {Function} f
     */
    transform(kind, with_id, f) {
        const ret = wasm.query_transform(this.__wbg_ptr, kind, with_id, f);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    validate() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.query_validate(ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} z
     * @param {number} policy
     */
    zoomOut(z, policy) {
        const ret = wasm.query_zoomOut(this.__wbg_ptr, z, policy);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}
if (Symbol.dispose) Query.prototype[Symbol.dispose] = Query.prototype.free;

/**
 * 値は JS のプリミティブ（`number | string | boolean | null | undefined`）を保持し、JS の `===` で比べる。
 */
export class SpatialIdMap {
    static __wrap(ptr) {
        const obj = Object.create(SpatialIdMap.prototype);
        obj.__wbg_ptr = ptr;
        SpatialIdMapFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpatialIdMapFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_spatialidmap_free(ptr, 0);
    }
    clear() {
        wasm.spatialidmap_clear(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    count() {
        const ret = wasm.spatialidmap_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {SpatialIdMap} other
     * @returns {SpatialIdMap}
     */
    difference(other) {
        _assertClass(other, SpatialIdMap);
        const ret = wasm.spatialidmap_difference(this.__wbg_ptr, other.__wbg_ptr);
        return SpatialIdMap.__wrap(ret);
    }
    /**
     * @returns {[Float64Array, unknown[]]}
     */
    entries() {
        const ret = wasm.spatialidmap_entries(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Float64Array | number[] | null} [allowed_intervals]
     * @returns {[Float64Array, unknown[]]}
     */
    flatSingleIds(allowed_intervals) {
        var ptr0 = isLikeNone(allowed_intervals) ? 0 : passArrayF64ToWasm0(allowed_intervals, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_flatSingleIds(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {[Float64Array, unknown[]]}
     */
    flexEntries() {
        const ret = wasm.spatialidmap_flexEntries(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    getFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_getFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    getOverlappingFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_getOverlappingFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    getOverlapping(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_getOverlapping(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    get(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_get(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @param {unknown} value
     */
    insert(id, value) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_insert(this.__wbg_ptr, ptr0, len0, value);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {SpatialIdMap} other
     * @returns {SpatialIdMap}
     */
    intersection(other) {
        _assertClass(other, SpatialIdMap);
        const ret = wasm.spatialidmap_intersection(this.__wbg_ptr, other.__wbg_ptr);
        return SpatialIdMap.__wrap(ret);
    }
    /**
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.spatialidmap_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.spatialidmap_new();
        this.__wbg_ptr = ret;
        SpatialIdMapFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Float64Array | number[] | null} [allowed_intervals]
     * @returns {[Float64Array, unknown[]]}
     */
    reconstructedTimeRanges(allowed_intervals) {
        var ptr0 = isLikeNone(allowed_intervals) ? 0 : passArrayF64ToWasm0(allowed_intervals, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_reconstructedTimeRanges(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    removeFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_removeFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    removeOverlappingFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_removeOverlappingFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    removeOverlapping(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_removeOverlapping(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    remove(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_remove(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    spatialFaceNeighborsFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_spatialFaceNeighborsFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {[Float64Array, unknown[]]}
     */
    spatialFaceNeighbors(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidmap_spatialFaceNeighbors(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {SpatialIdMap} other
     * @returns {SpatialIdMap}
     */
    union(other) {
        _assertClass(other, SpatialIdMap);
        const ret = wasm.spatialidmap_union(this.__wbg_ptr, other.__wbg_ptr);
        return SpatialIdMap.__wrap(ret);
    }
}
if (Symbol.dispose) SpatialIdMap.prototype[Symbol.dispose] = SpatialIdMap.prototype.free;

export class SpatialIdSet {
    static __wrap(ptr) {
        const obj = Object.create(SpatialIdSet.prototype);
        obj.__wbg_ptr = ptr;
        SpatialIdSetFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpatialIdSetFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_spatialidset_free(ptr, 0);
    }
    clear() {
        wasm.spatialidset_clear(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    count() {
        const ret = wasm.spatialidset_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {SpatialIdSet} other
     * @returns {SpatialIdSet}
     */
    difference(other) {
        _assertClass(other, SpatialIdSet);
        const ret = wasm.spatialidset_difference(this.__wbg_ptr, other.__wbg_ptr);
        return SpatialIdSet.__wrap(ret);
    }
    /**
     * @param {Float64Array | number[] | null} [allowed_intervals]
     * @returns {Float64Array}
     */
    flatSingleIds(allowed_intervals) {
        var ptr0 = isLikeNone(allowed_intervals) ? 0 : passArrayF64ToWasm0(allowed_intervals, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_flatSingleIds(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @returns {Float64Array}
     */
    flexIds() {
        const ret = wasm.spatialidset_flexIds(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * @param {SpatialIdMap} map
     * @returns {SpatialIdSet}
     */
    static fromMap(map) {
        _assertClass(map, SpatialIdMap);
        const ret = wasm.spatialidset_fromMap(map.__wbg_ptr);
        return SpatialIdSet.__wrap(ret);
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    getFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_getFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    getOverlappingFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_getOverlappingFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    getOverlapping(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_getOverlapping(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    get(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_get(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @returns {Float64Array}
     */
    ids() {
        const ret = wasm.spatialidset_ids(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * @param {Float64Array | number[]} id
     */
    insert(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_insert(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {SpatialIdSet} other
     * @returns {SpatialIdSet}
     */
    intersection(other) {
        _assertClass(other, SpatialIdSet);
        const ret = wasm.spatialidset_intersection(this.__wbg_ptr, other.__wbg_ptr);
        return SpatialIdSet.__wrap(ret);
    }
    /**
     * @returns {boolean}
     */
    isEmpty() {
        const ret = wasm.spatialidset_isEmpty(this.__wbg_ptr);
        return ret !== 0;
    }
    constructor() {
        const ret = wasm.spatialidset_new();
        this.__wbg_ptr = ret;
        SpatialIdSetFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Float64Array | number[] | null} [allowed_intervals]
     * @returns {Float64Array}
     */
    reconstructedTimeRanges(allowed_intervals) {
        var ptr0 = isLikeNone(allowed_intervals) ? 0 : passArrayF64ToWasm0(allowed_intervals, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_reconstructedTimeRanges(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    removeFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_removeFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    removeOverlappingFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_removeOverlappingFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    removeOverlapping(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_removeOverlapping(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    remove(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_remove(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    spatialFaceNeighborsFlexIds(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_spatialFaceNeighborsFlexIds(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {Float64Array | number[]} id
     * @returns {Float64Array}
     */
    spatialFaceNeighbors(id) {
        const ptr0 = passArrayF64ToWasm0(id, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spatialidset_spatialFaceNeighbors(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v2;
    }
    /**
     * @param {SpatialIdSet} other
     * @returns {SpatialIdSet}
     */
    union(other) {
        _assertClass(other, SpatialIdSet);
        const ret = wasm.spatialidset_union(this.__wbg_ptr, other.__wbg_ptr);
        return SpatialIdSet.__wrap(ret);
    }
}
if (Symbol.dispose) SpatialIdSet.prototype[Symbol.dispose] = SpatialIdSet.prototype.free;
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_208446807d0d1e30: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg___wbindgen_boolean_get_4f1baf9a00be3c74: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_is_falsy_d864b623500ae65d: function(arg0) {
            const ret = !arg0;
            return ret;
        },
        __wbg___wbindgen_is_null_c22311b1cc228e3a: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_undefined_be5b34249ff1fc15: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_number_get_934b640d0889af78: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64((arg0 >>> 0) + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_7ce8eee7fd327545: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_4c88d8bf264fd984: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_a410eb4b59ed5965: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_call_fc92fee6137d452d: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.call(arg1, arg2, arg3);
            return ret;
        }, arguments); },
        __wbg_new_37eb45aaf5eeb820: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_4416a2fe2fac9c65: function(arg0, arg1) {
            const ret = new TypeError(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_8a1847cd91d0d7fb: function(arg0, arg1) {
            const ret = new RangeError(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_from_slice_aaf85a9746711968: function(arg0, arg1) {
            const ret = new Float64Array(getArrayF64FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_of_e7ea0fcd535c1444: function(arg0, arg1) {
            const ret = Array.of(arg0, arg1);
            return ret;
        },
        __wbg_push_c9f4893fc209f768: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbindgen_generic_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_generic_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            table.set(0, undefined);
            table.set(1024, undefined);
            table.set(1025, null);
            table.set(1026, true);
            table.set(1027, false);
        },
    };
    return {
        __proto__: null,
        "./spatial_id_bg.js": import0,
    };
}

const QueryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_query_free(ptr, 1));
const SpatialIdMapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_spatialidmap_free(ptr, 1));
const SpatialIdSetFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_spatialidset_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(bytes) {
    numBytesDecoded += bytes.length;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
        cachedTextDecoder.decode();
        numBytesDecoded = bytes.length;
    }
    return cachedTextDecoder.decode(bytes);
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

let __wbg_init_promise;
async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;
    if (__wbg_init_promise === undefined) {
        __wbg_init_promise = __wbg_init_once(module_or_path);
        __wbg_init_promise.catch(() => { __wbg_init_promise = undefined; });
    }
    return __wbg_init_promise;
}

async function __wbg_init_once(module_or_path) {

    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }


    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
