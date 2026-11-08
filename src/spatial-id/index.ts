/**
 * 時空間 ID。
 *
 * - {@link SingleId}: 1つのボクセル `{z}/{f}/{x}/{y}_{i}/{t}`
 * - {@link RangeId}: 各軸を範囲で指定したボクセルの集まり
 * - {@link FlexId}: 軸ごとに異なるズームレベルを持つ ID
 *
 * 時間間隔 `{i}` は {@link time!Interval} で表す。
 *
 * ```ts
 * const single = SingleId.create(12, 0, 3638, 1614).timeWith(Interval.HOUR, 0);
 * const range = RangeId.parse("4/-3/8:9/5:10");
 * for (const flex of range) {
 *   console.log(flex.toString());
 * }
 * ```
 *
 * 値が不正なときは {@link SpatialIdError} を投げる。`info.kind` で種類を判別できる。
 *
 * ```ts
 * try {
 *   SingleId.create(31, 0, 0, 0);
 * } catch (e) {
 *   if (e instanceof SpatialIdError && e.info.kind === "ZOutOfRange") {
 *     console.log(e.info.z); // 31
 *   }
 * }
 * ```
 *
 * @disableGroups
 * @sortStrategy documents-first
 * @module
 */

// biome-ignore assist/source/organizeImports: @sortStrategy documents-first はドキュメント以外を並べ替えないので、docs はこの export の順に並ぶ
export { SingleId } from "./singleId.js";
export { RangeId } from "./rangeId.js";
export { FlexId } from "./flexId.js";
export type { SpatialId } from "./spatialId.js";
export { SpatialIdError, type SpatialIdErrorInfo } from "./error.js";
export { ZoomLevel } from "./zoomLevel.js";
