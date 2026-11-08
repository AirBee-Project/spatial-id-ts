/**
 * 時空間 ID の集合とマップ。
 *
 * - {@link SpatialIdSet}: 時空間 ID の集合
 * - {@link SpatialIdMap}: 時空間 ID の場所ごとに値を持つマップ
 *
 * 重なる ID を挿入しても、同じ場所を二重には持たない。取り出すときは {@link spatial-id!RangeId} で返す。
 *
 * ```ts
 * const set = new SpatialIdSet([SingleId.create(4, 3, 2, 1)]);
 * set.insert(RangeId.create(4, 3, [2, 3], 1));
 * console.log(set.get(SingleId.create(4, 3, 3, 1)).map(String)); // ["4/3/3/1"]
 *
 * const map = new SpatialIdMap<number>();
 * map.insert(SingleId.create(4, 3, 2, 1), 10);
 * for (const [id, value] of map) {
 *   console.log(id.toString(), value);
 * }
 * ```
 *
 * 中身は Wasm で持ち、最初にコンストラクターを呼んだときに同期で読み込む。
 * Cloudflare Workers では動かない。
 *
 * @disableGroups
 * @sortStrategy documents-first
 * @module
 */

// biome-ignore assist/source/organizeImports: @sortStrategy documents-first はドキュメント以外を並べ替えないので、docs はこの export の順に並ぶ
export { SpatialIdSet } from "./spatialIdSet.js";
export { SpatialIdMap } from "./spatialIdMap.js";
