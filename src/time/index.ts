/**
 * 時間の間隔と、時間のズームレベル。
 *
 * - {@link Interval}: 時間間隔 `{i}`
 * - {@link AllowedIntervals}: 読み出しで `{i}` として使ってよい時間間隔の候補集合
 * - {@link TZoomLevel}: 時間軸のズームレベル
 *
 * ```ts
 * const id = SingleId.create(12, 0, 3638, 1614).timeWith(Interval.HOUR, 0);
 * const set = new SpatialIdSet([id]);
 * set.reconstructedTimeRanges(AllowedIntervals.calendar());
 * ```
 *
 * @disableGroups
 * @sortStrategy documents-first
 * @module
 */

// biome-ignore assist/source/organizeImports: @sortStrategy documents-first はドキュメント以外を並べ替えないので、docs はこの export の順に並ぶ
export { Interval } from "./interval.js";
export { AllowedIntervals } from "./allowedIntervals.js";
export { TZoomLevel } from "../spatial-id/zoomLevel.js";
