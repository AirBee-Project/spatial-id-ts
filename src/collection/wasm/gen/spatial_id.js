/* @ts-self-types="./spatial_id.d.ts" */

/**
 * 値は JS の `===` で比べる（`JsValue` の `PartialEq`）。
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
     * @param {Float64Array | null} [allowed_intervals]
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array | null} [allowed_intervals]
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array | null} [allowed_intervals]
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array | null} [allowed_intervals]
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
     * @param {Float64Array} id
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
        __wbg_Error_30c8987f7c2ed4e2: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg___wbindgen_jsval_eq_02babf21faa37971: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_new_ee2291f50781bf1d: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_from_slice_f545fd22ddc142b8: function(arg0, arg1) {
            const ret = new Float64Array(getArrayF64FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_of_20798cb14708764f: function(arg0, arg1) {
            const ret = Array.of(arg0, arg1);
            return ret;
        },
        __wbg_push_2baf45db356cf468: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./spatial_id_bg.js": import0,
    };
}

const SpatialIdMapFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_spatialidmap_free(ptr, 1));
const SpatialIdSetFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_spatialidset_free(ptr, 1));

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
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

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
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

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


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
