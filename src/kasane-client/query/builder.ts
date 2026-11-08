import { create } from "@bufbuild/protobuf";
import {
  toProtoDirection,
  toProtoFalloffPattern,
  toProtoMathOperator,
  toProtoMergePolicy,
  toProtoTableDataType,
  toTypedValue,
} from "../../proto/convert.js";
import {
  FilterConditionSchema,
  MathOperandSchema,
  type QueryNode,
  QueryNodeSchema,
} from "../../proto/gen/query_pb.js";
import type { PrimitiveValue, TableDataType } from "../database/types.js";
import type {
  Direction,
  FalloffPattern,
  FilterConditionInput,
  MathOperator,
  MergePolicy,
} from "./types.js";

/**
 * 空間クエリ（AST）を流れるようなインターフェースで構築するビルダー。
 */
export class QueryBuilder {
  private readonly node: QueryNode;

  /** @internal */
  constructor(node: QueryNode) {
    this.node = node;
  }

  /**
   * 値フィルタを適用する。
   *
   * 例:
   * `.filter({ equals: "active" })`
   * `.filter({ inRange: { min: 10, max: 50 } })`
   * `.filter({ min: 0 })`
   */
  public filter(condition: FilterConditionInput): QueryBuilder {
    let mode: NonNullable<
      Parameters<typeof create<typeof FilterConditionSchema>>[1]
    >["mode"];

    if ("equals" in condition) {
      mode = {
        case: "equals",
        value: { value: toTypedValue(condition.equals) },
      };
    } else if ("notInRange" in condition) {
      mode = {
        case: "notInRange",
        value: {
          min:
            condition.notInRange.min !== undefined
              ? toTypedValue(condition.notInRange.min)
              : undefined,
          max:
            condition.notInRange.max !== undefined
              ? toTypedValue(condition.notInRange.max)
              : undefined,
        },
      };
    } else {
      mode = {
        case: "inRange",
        value: {
          min:
            condition.min !== undefined
              ? toTypedValue(condition.min)
              : undefined,
          max:
            condition.max !== undefined
              ? toTypedValue(condition.max)
              : undefined,
        },
      };
    }

    const filterNode = create(QueryNodeSchema, {
      node: {
        case: "filterValues",
        value: {
          input: this.node,
          condition: create(FilterConditionSchema, { mode }),
        },
      },
    });
    return new QueryBuilder(filterNode);
  }

  /** X 方向への平行移動。 */
  public shiftX(z: number, index: number): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: { case: "shiftX", value: { input: this.node, z, index } },
      }),
    );
  }

  /** Y 方向への平行移動。 */
  public shiftY(z: number, index: number): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: { case: "shiftY", value: { input: this.node, z, index } },
      }),
    );
  }

  /** F 方向（高さ）への平行移動。 */
  public shiftF(z: number, index: number): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: { case: "shiftF", value: { input: this.node, z, index } },
      }),
    );
  }

  /** 指定されたズームレベルまで落とし、`policy` で集約する。 */
  public zoomOut(z: number, policy?: MergePolicy): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "zoomOut",
          value: { input: this.node, z, policy: toProtoMergePolicy(policy) },
        },
      }),
    );
  }

  /** X 方向の絶対座標範囲へ引き延ばす。 */
  public extrudeX(
    z: number,
    start: number,
    end: number,
    policy?: MergePolicy,
  ): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "extrudeX",
          value: {
            input: this.node,
            z,
            start,
            end,
            policy: toProtoMergePolicy(policy),
          },
        },
      }),
    );
  }

  /** Y 方向の絶対座標範囲へ引き延ばす。 */
  public extrudeY(
    z: number,
    start: number,
    end: number,
    policy?: MergePolicy,
  ): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "extrudeY",
          value: {
            input: this.node,
            z,
            start,
            end,
            policy: toProtoMergePolicy(policy),
          },
        },
      }),
    );
  }

  /** F 方向（高さ）の絶対座標範囲へ引き延ばす。 */
  public extrudeF(
    z: number,
    start: number,
    end: number,
    policy?: MergePolicy,
  ): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "extrudeF",
          value: {
            input: this.node,
            z,
            start,
            end,
            policy: toProtoMergePolicy(policy),
          },
        },
      }),
    );
  }

  /** X 方向へ値を減衰させる。 */
  public falloffX(
    z: number,
    radius: number,
    options?: {
      pattern?: FalloffPattern;
      direction?: Direction;
      policy?: MergePolicy;
    },
  ): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "falloffX",
          value: {
            input: this.node,
            z,
            radius,
            pattern: toProtoFalloffPattern(options?.pattern),
            direction:
              options?.direction !== undefined
                ? toProtoDirection(options.direction)
                : undefined,
            policy: toProtoMergePolicy(options?.policy),
          },
        },
      }),
    );
  }

  /** Y 方向へ値を減衰させる。 */
  public falloffY(
    z: number,
    radius: number,
    options?: {
      pattern?: FalloffPattern;
      direction?: Direction;
      policy?: MergePolicy;
    },
  ): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "falloffY",
          value: {
            input: this.node,
            z,
            radius,
            pattern: toProtoFalloffPattern(options?.pattern),
            direction:
              options?.direction !== undefined
                ? toProtoDirection(options.direction)
                : undefined,
            policy: toProtoMergePolicy(options?.policy),
          },
        },
      }),
    );
  }

  /** F 方向（高さ）へ値を減衰させる。 */
  public falloffF(
    z: number,
    radius: number,
    options?: {
      pattern?: FalloffPattern;
      direction?: Direction;
      policy?: MergePolicy;
    },
  ): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "falloffF",
          value: {
            input: this.node,
            z,
            radius,
            pattern: toProtoFalloffPattern(options?.pattern),
            direction:
              options?.direction !== undefined
                ? toProtoDirection(options.direction)
                : undefined,
            policy: toProtoMergePolicy(options?.policy),
          },
        },
      }),
    );
  }

  /** 別のクエリと重ね合わせる。 */
  public merge(
    right: QueryBuilder | QueryNode,
    options?: {
      policy?: MergePolicy;
      defaultValue?: PrimitiveValue;
    },
  ): QueryBuilder {
    const rightNode = right instanceof QueryBuilder ? right.toProto() : right;
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "merge",
          value: {
            left: this.node,
            right: rightNode,
            policy: toProtoMergePolicy(options?.policy),
            defaultValue: toTypedValue(options?.defaultValue ?? null),
          },
        },
      }),
    );
  }

  /** 空間差分（left - right）。 */
  public difference(right: QueryBuilder | QueryNode): QueryBuilder {
    const rightNode = right instanceof QueryBuilder ? right.toProto() : right;
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "difference",
          value: { left: this.node, right: rightNode },
        },
      }),
    );
  }

  /** 空間積（left ∩ right）。 */
  public intersection(right: QueryBuilder | QueryNode): QueryBuilder {
    const rightNode = right instanceof QueryBuilder ? right.toProto() : right;
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "intersection",
          value: { left: this.node, right: rightNode },
        },
      }),
    );
  }

  /** 値をマッピング表に基づいて変換する。 */
  public mapValues(options: {
    outputType: TableDataType;
    mapping: Array<{
      from: PrimitiveValue;
      to: PrimitiveValue;
    }>;
    defaultValue?: PrimitiveValue;
  }): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "mapValues",
          value: {
            input: this.node,
            outputType: toProtoTableDataType(options.outputType),
            mapping: options.mapping.map((m) => ({
              from: toTypedValue(m.from),
              to: toTypedValue(m.to),
            })),
            defaultValue: toTypedValue(options.defaultValue ?? null),
          },
        },
      }),
    );
  }

  /** 内部的な四則演算ノードの生成。 */
  private mathNode(
    operator: MathOperator,
    operand: number | bigint,
  ): QueryBuilder {
    const operandValue: NonNullable<
      Parameters<typeof create<typeof MathOperandSchema>>[1]
    >["value"] =
      typeof operand === "bigint"
        ? { case: "intValue", value: operand }
        : Number.isInteger(operand)
          ? { case: "intValue", value: BigInt(operand) }
          : { case: "floatValue", value: operand };

    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: {
          case: "mathValues",
          value: {
            input: this.node,
            operator: toProtoMathOperator(operator),
            operand: create(MathOperandSchema, { value: operandValue }),
          },
        },
      }),
    );
  }

  /** 加算演算（input + operand）。 */
  public add(operand: number | bigint): QueryBuilder {
    return this.mathNode("add", operand);
  }

  /** 減算演算（input - operand）。 */
  public subtract(operand: number | bigint): QueryBuilder {
    return this.mathNode("subtract", operand);
  }

  /** 乗算演算（input * operand）。 */
  public multiply(operand: number | bigint): QueryBuilder {
    return this.mathNode("multiply", operand);
  }

  /** 除算演算（input / operand）。 */
  public divide(operand: number | bigint): QueryBuilder {
    return this.mathNode("divide", operand);
  }

  /** 生成された wire フォーマットの `QueryNode` を取得する。 */
  public toProto(): QueryNode {
    return this.node;
  }
}

/** クエリ式構築用のエントリーポイント。 */
export const query = {
  /** 演算の起点となるテーブルを指定する。 */
  source(database: string, table: string): QueryBuilder {
    return new QueryBuilder(
      create(QueryNodeSchema, {
        node: { case: "source", value: { database, table } },
      }),
    );
  },
};
