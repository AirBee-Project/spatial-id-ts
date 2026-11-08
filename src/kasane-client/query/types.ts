import type { PrimitiveValue } from "../database/types.js";

/** {@link QueryBuilder.filter} に渡す値の条件。 */
export type FilterConditionInput =
  /** 値が `equals` と等しい。 */
  | {
      /** 比べる値。 */
      equals: PrimitiveValue;
    }
  /** 値が `min` 以上 `max` 以下。片方だけでもよい。 */
  | {
      /** 下限（含む）。 */
      min?: PrimitiveValue;
      /** 上限（含む）。 */
      max?: PrimitiveValue;
    }
  /** 値が `notInRange` の範囲に入らない。 */
  | {
      /** 除外する範囲。 */
      notInRange: {
        /** 下限（含む）。 */
        min?: PrimitiveValue;
        /** 上限（含む）。 */
        max?: PrimitiveValue;
      };
    };

/**
 * 同じ空間に複数の値が集まったときの集約規則。
 *
 * - `overwrite`: 後の値で上書きする
 * - `keepExisting`: 既存の値を優先する
 * - `sum`: 合計する
 * - `max`: 大きい方を採る
 * - `min`: 小さい方を採る
 * - `average`: 平均を採る
 * - `difference`: 差を採る
 */
export type MergePolicy =
  | "overwrite"
  | "keepExisting"
  | "sum"
  | "max"
  | "min"
  | "average"
  | "difference";

/** 値の四則演算の種類。 */
export type MathOperator = "add" | "subtract" | "multiply" | "divide";

/**
 * 減衰（falloff）で、距離 `d` に応じて値を減らす割合。半径を `r` とする。
 *
 * - `linear`: `(r - d) / r`。距離に比例して減る
 * - `quadraticIn`: `1 - (d / r)²`。近くではゆっくり、遠くで急に減る
 * - `quadraticOut`: `((r - d) / r)²`。近くで急に、遠くではゆっくり減る
 */
export type FalloffPattern = "linear" | "quadraticIn" | "quadraticOut";

/** 軸に沿って広げる向き。`upper` は座標が大きい側、`lower` は小さい側。 */
export type Direction = "upper" | "lower";
