import { create } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import type {
  PrimitiveValue,
  TableDataType,
  TableInfo,
  ZoomLevelPolicy,
} from "../kasane-client/database/types.js";
import type {
  Direction,
  FalloffPattern,
  MathOperator,
  MergePolicy,
} from "../kasane-client/query/types.js";
import type { OutputFormat } from "../kasane-client/result/types.js";
import { FlexId } from "../spatial-id/flexId.js";
import { RangeId } from "../spatial-id/rangeId.js";
import { SingleId } from "../spatial-id/singleId.js";
import type { SpatialId } from "../spatial-id/spatialId.js";
import { ZoomLevel } from "../spatial-id/zoomLevel.js";
import {
  FlexIdSchema,
  NullValue,
  type FlexId as ProtoFlexId,
  type RangeId as ProtoRangeId,
  type SingleId as ProtoSingleId,
  type SpatialId as ProtoSpatialId,
  TableDataType as ProtoTableDataType,
  type TypedValue as ProtoTypedValue,
  ZoomLevelPolicy as ProtoZoomLevelPolicy,
  RangeIdSchema,
  SingleIdSchema,
  SpatialIdSchema,
  TypedValueSchema,
} from "./gen/common_pb.js";
import { OutputFormat as ProtoOutputFormat } from "./gen/data_pb.js";
import {
  Direction as ProtoDirection,
  FalloffPattern as ProtoFalloffPattern,
  MathOperator as ProtoMathOperator,
  MergePolicyKind as ProtoMergePolicyKind,
} from "./gen/query_pb.js";
import type { TableInfo as ProtoTableInfo } from "./gen/table_pb.js";

/** `SingleId`/`RangeId`/`FlexId` を、対応するwireフォーマットの `SpatialId`(oneof)へ変換する。 */
export function toProtoSpatialId(id: SpatialId): ProtoSpatialId {
  if (id instanceof SingleId) {
    return create(SpatialIdSchema, {
      kind: { case: "singleId", value: toProtoSingleId(id) },
    });
  }
  if (id instanceof RangeId) {
    return create(SpatialIdSchema, {
      kind: { case: "rangeId", value: toProtoRangeId(id) },
    });
  }
  return create(SpatialIdSchema, {
    kind: { case: "flexId", value: toProtoFlexId(id) },
  });
}

/** wireフォーマットの `SpatialId`(oneof)を、対応する `SingleId`/`RangeId`/`FlexId` へ変換する。 */
export function fromProtoSpatialId(pb: ProtoSpatialId): SpatialId {
  switch (pb.kind.case) {
    case "singleId":
      return fromProtoSingleId(pb.kind.value);
    case "rangeId":
      return fromProtoRangeId(pb.kind.value);
    case "flexId":
      return fromProtoFlexId(pb.kind.value);
    default:
      throw new ConnectError(
        "SpatialId is missing its oneof value",
        Code.Internal,
      );
  }
}

export function toProtoSingleId(id: SingleId): ProtoSingleId {
  return create(SingleIdSchema, {
    z: id.z,
    f: id.f,
    x: id.x,
    y: id.y,
    i: BigInt(id.i.seconds()),
    t: BigInt(id.t),
  });
}

export function fromProtoSingleId(pb: ProtoSingleId): SingleId {
  const single = SingleId.create(pb.z, pb.f, pb.x, pb.y);
  if (pb.i === undefined && pb.t === undefined) {
    return single;
  }
  if (pb.i === undefined || pb.t === undefined) {
    throw new ConnectError(
      "SingleId.i and SingleId.t must be specified together",
      Code.Internal,
    );
  }
  return single.timeWith(Number(pb.i), Number(pb.t));
}

export function toProtoRangeId(id: RangeId): ProtoRangeId {
  return create(RangeIdSchema, {
    z: id.z,
    f: { min: id.f[0], max: id.f[1] },
    x: { min: id.x[0], max: id.x[1] },
    y: { min: id.y[0], max: id.y[1] },
    i: BigInt(id.i.seconds()),
    t: { min: BigInt(id.t[0]), max: BigInt(id.t[1]) },
  });
}

export function fromProtoRangeId(pb: ProtoRangeId): RangeId {
  // f/x/yの省略は「その軸全体」を意味するので、そのズームレベルの全範囲を補う。
  const zoom = ZoomLevel.create(pb.z);
  const f: [number, number] = pb.f
    ? [pb.f.min, pb.f.max]
    : [zoom.fMin(), zoom.fMax()];
  const x: [number, number] = pb.x ? [pb.x.min, pb.x.max] : [0, zoom.xyMax()];
  const y: [number, number] = pb.y ? [pb.y.min, pb.y.max] : [0, zoom.xyMax()];
  const range = RangeId.create(pb.z, f, x, y);

  if (pb.i === undefined && pb.t === undefined) {
    return range;
  }
  if (pb.i === undefined || pb.t === undefined) {
    throw new ConnectError(
      "RangeId.i and RangeId.t must be specified together",
      Code.Internal,
    );
  }
  return range.timeWith(Number(pb.i), [Number(pb.t.min), Number(pb.t.max)]);
}

export function toProtoFlexId(id: FlexId): ProtoFlexId {
  return create(FlexIdSchema, {
    fZoomlevel: id.fZoomLevel,
    fIndex: id.fIndex,
    xZoomlevel: id.xZoomLevel,
    xIndex: id.xIndex,
    yZoomlevel: id.yZoomLevel,
    yIndex: id.yIndex,
    tZoomlevel: id.tZoomLevel,
    tIndex: BigInt(id.tIndex),
  });
}

export function fromProtoFlexId(pb: ProtoFlexId): FlexId {
  const flex = FlexId.create(
    pb.fZoomlevel,
    pb.fIndex,
    pb.xZoomlevel,
    pb.xIndex,
    pb.yZoomlevel,
    pb.yIndex,
  );
  if (pb.tZoomlevel === undefined && pb.tIndex === undefined) {
    return flex;
  }
  if (pb.tZoomlevel === undefined || pb.tIndex === undefined) {
    throw new ConnectError(
      "FlexId.t_zoomlevel and FlexId.t_index must be specified together",
      Code.Internal,
    );
  }
  return flex.withTimeSegment(pb.tZoomlevel, Number(pb.tIndex));
}

/**
 * 単一の SpatialId、または配列を受け取って ProtoSpatialId の配列へ正規化する。
 */
export function normalizeSpatialIds(
  ids: SpatialId | SpatialId[],
): ProtoSpatialId[] {
  if (Array.isArray(ids)) {
    return ids.map((id) => toProtoSpatialId(id));
  }
  return [toProtoSpatialId(ids)];
}

// --- JS プリミティブ ⇄ TypedValue ---

/** JS のプリミティブ値または既存の ProtoTypedValue を ProtoTypedValue へ変換する。 */
export function toTypedValue(
  value: PrimitiveValue | ProtoTypedValue,
): ProtoTypedValue {
  if (value === null || value === undefined) {
    return create(TypedValueSchema, {
      kind: { case: "nullVal", value: NullValue.NULL_VALUE },
    });
  }
  if (typeof value === "string") {
    return create(TypedValueSchema, { kind: { case: "stringVal", value } });
  }
  if (typeof value === "number") {
    return create(TypedValueSchema, {
      kind: { case: "intVal", value: BigInt(Math.trunc(value)) },
    });
  }
  if (typeof value === "bigint") {
    return create(TypedValueSchema, { kind: { case: "intVal", value } });
  }
  if (typeof value === "boolean") {
    return create(TypedValueSchema, { kind: { case: "boolVal", value } });
  }
  if (typeof value === "object" && "kind" in value) {
    return value as ProtoTypedValue;
  }
  throw new ConnectError(
    `Unsupported value type for TypedValue: ${typeof value}`,
    Code.InvalidArgument,
  );
}

/**
 * ProtoTypedValue を JS のプリミティブ値へ変換する。
 * INT は `number` で返す。
 */
export function fromTypedValue(
  pb: ProtoTypedValue,
): string | number | boolean | null {
  switch (pb.kind.case) {
    case "stringVal":
      return pb.kind.value;
    case "intVal":
      return Number(pb.kind.value);
    case "boolVal":
      return pb.kind.value;
    case "nullVal":
      return null;
    default:
      return null;
  }
}

export function toProtoZoomLevelPolicy(
  policy?: ZoomLevelPolicy,
  defaultPolicy: ProtoZoomLevelPolicy = ProtoZoomLevelPolicy.ERROR,
): ProtoZoomLevelPolicy {
  if (!policy) {
    return defaultPolicy;
  }
  switch (policy) {
    case "error":
      return ProtoZoomLevelPolicy.ERROR;
    case "ignore":
      return ProtoZoomLevelPolicy.IGNORE;
    case "normalize":
      return ProtoZoomLevelPolicy.NORMALIZE;
    default:
      return defaultPolicy;
  }
}

export function toProtoOutputFormat(format?: OutputFormat): ProtoOutputFormat {
  if (!format) {
    return ProtoOutputFormat.UNSPECIFIED;
  }
  switch (format) {
    case "singleId":
      return ProtoOutputFormat.SINGLE_ID;
    case "rangeId":
      return ProtoOutputFormat.RANGE_ID;
    case "flexId":
      return ProtoOutputFormat.FLEX_ID;
    default:
      return ProtoOutputFormat.UNSPECIFIED;
  }
}

export function toProtoTableDataType(type: TableDataType): ProtoTableDataType {
  switch (type) {
    case "text":
      return ProtoTableDataType.TEXT;
    case "int":
      return ProtoTableDataType.INT;
    case "boolean":
      return ProtoTableDataType.BOOLEAN;
    case "enum":
      return ProtoTableDataType.ENUM;
    case "presence":
      return ProtoTableDataType.PRESENCE;
    default:
      return ProtoTableDataType.UNSPECIFIED;
  }
}

/**
 * proto の `TableDataType` を JS の型名へ戻す。
 */
export function fromProtoTableDataType(
  type: ProtoTableDataType,
): TableDataType {
  switch (type) {
    case ProtoTableDataType.TEXT:
      return "text";
    case ProtoTableDataType.INT:
      return "int";
    case ProtoTableDataType.BOOLEAN:
      return "boolean";
    case ProtoTableDataType.ENUM:
      return "enum";
    case ProtoTableDataType.PRESENCE:
      return "presence";
    default:
      throw new ConnectError(`Unknown TableDataType: ${type}`, Code.Internal);
  }
}

/** proto の `TableInfo` を JS 側の形へ直す。 */
export function fromProtoTableInfo(pb: ProtoTableInfo): TableInfo {
  return {
    name: pb.name,
    dataType: fromProtoTableDataType(pb.dataType),
    maxZoomLevel: pb.maxZoomLevel,
    isTemporal: pb.isTemporal,
    count: Number(pb.count),
    constraints: pb.constraints,
    description: pb.description,
  };
}

export function toProtoMergePolicy(policy?: MergePolicy): ProtoMergePolicyKind {
  if (!policy) {
    return ProtoMergePolicyKind.UNSPECIFIED;
  }
  switch (policy) {
    case "overwrite":
      return ProtoMergePolicyKind.OVERWRITE;
    case "keepExisting":
      return ProtoMergePolicyKind.KEEP_EXISTING;
    case "sum":
      return ProtoMergePolicyKind.SUM;
    case "max":
      return ProtoMergePolicyKind.MAX;
    case "min":
      return ProtoMergePolicyKind.MIN;
    case "average":
      return ProtoMergePolicyKind.AVERAGE;
    case "difference":
      return ProtoMergePolicyKind.DIFFERENCE;
    default:
      return ProtoMergePolicyKind.UNSPECIFIED;
  }
}

export function toProtoMathOperator(op: MathOperator): ProtoMathOperator {
  switch (op) {
    case "add":
      return ProtoMathOperator.ADD;
    case "subtract":
      return ProtoMathOperator.SUBTRACT;
    case "multiply":
      return ProtoMathOperator.MULTIPLY;
    case "divide":
      return ProtoMathOperator.DIVIDE;
    default:
      return ProtoMathOperator.UNSPECIFIED;
  }
}

export function toProtoFalloffPattern(
  pattern?: FalloffPattern,
): ProtoFalloffPattern {
  if (!pattern) {
    return ProtoFalloffPattern.UNSPECIFIED;
  }
  switch (pattern) {
    case "linear":
      return ProtoFalloffPattern.LINEAR;
    case "quadraticIn":
      return ProtoFalloffPattern.QUADRATIC_IN;
    case "quadraticOut":
      return ProtoFalloffPattern.QUADRATIC_OUT;
    default:
      return ProtoFalloffPattern.UNSPECIFIED;
  }
}

export function toProtoDirection(dir?: Direction): ProtoDirection {
  if (!dir) {
    return ProtoDirection.UNSPECIFIED;
  }
  switch (dir) {
    case "upper":
      return ProtoDirection.UPPER;
    case "lower":
      return ProtoDirection.LOWER;
    default:
      return ProtoDirection.UNSPECIFIED;
  }
}
