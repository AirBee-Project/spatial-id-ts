import type { TableConstraints } from "../../proto/gen/common_pb.js";

/** テーブルに格納できる値。`null` と `undefined` は値なしとして送る。 */
export type PrimitiveValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined;

/**
 * テーブルが格納する値の型。
 *
 * - `text`: 文字列
 * - `int`: 整数
 * - `boolean`: 真偽値
 * - `enum`: 選択肢のどれか
 * - `presence`: 値を持たず、その空間 ID にデータがあるかだけを表す
 */
export type TableDataType = "text" | "int" | "boolean" | "enum" | "presence";

/**
 * テーブルの最大ズームレベルより深い空間 ID を渡したときの扱い。省略すると `error`。
 *
 * - `error`: エラーにする
 * - `ignore`: その空間 ID を無視する
 * - `normalize`: テーブルの最大ズームレベルに丸める
 */
export type ZoomLevelPolicy = "error" | "ignore" | "normalize";

/** テーブルの情報。 */
export type TableInfo = {
  /** テーブル名。 */
  name: string;
  /** 格納する値の型。 */
  dataType: TableDataType;
  /** 格納できる空間 ID の最大ズームレベル。 */
  maxZoomLevel: number;
  /** 時間 ID を扱うか。 */
  isTemporal: boolean;
  /** 保持している空間 ID（FlexId）の総数。 */
  count: number;
  /** 値の制約。 */
  constraints?: TableConstraints | undefined;
  /** テーブルの説明文。 */
  description?: string | undefined;
};
