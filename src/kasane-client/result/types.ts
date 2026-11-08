/**
 * 結果として返す空間 ID の形式。省略すると `rangeId`。
 *
 * - `singleId`: {@link spatial-id!SingleId}
 * - `rangeId`: {@link spatial-id!RangeId}
 * - `flexId`: {@link spatial-id!FlexId}
 */
export type OutputFormat = "singleId" | "rangeId" | "flexId";
