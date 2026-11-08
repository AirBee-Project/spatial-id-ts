import { fromProtoSpatialId, fromTypedValue } from "../../proto/convert.js";
import type { TypedValue } from "../../proto/gen/common_pb.js";
import type { SearchDataResponse } from "../../proto/gen/data_pb.js";
import type { SpatialId } from "../../spatial-id/spatialId.js";

/** 検索・クエリ結果の単一アイテム。空間IDと値のペア。 */
export interface ResultItem<T = unknown> {
  /** 値を持つ空間 ID。 */
  id: SpatialId;
  /** 空間 ID が持つ値。 */
  value: T;
}

/**
 * 検索・クエリの結果のストリーム。
 */
export class ResultStream<T = unknown> implements AsyncIterable<ResultItem<T>> {
  private readonly sourceStream: AsyncIterable<SearchDataResponse>;

  /** @internal */
  constructor(sourceStream: AsyncIterable<SearchDataResponse>) {
    this.sourceStream = sourceStream;
  }

  /**
   * チャンクごとの値辞書と空間IDを自動解決し、
   * `{ id, value }` のアイテムを順次 yield する非同期イテレータ。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーの応答を解釈できないとき。
   */
  public async *[Symbol.asyncIterator](): AsyncIterator<ResultItem<T>> {
    // dictionary はストリーム全体で共有され、各チャンクはその追加分だけを運ぶ。
    const dictionary: TypedValue[] = [];
    for await (const chunk of this.sourceStream) {
      dictionary.push(...chunk.dictionary);
      for (const group of chunk.data) {
        const rawTypedValue =
          group.value.case === "dictRef"
            ? dictionary[Number(group.value.value)]
            : group.value.case === "inlineValue"
              ? group.value.value
              : undefined;
        const unpackedValue = (
          rawTypedValue !== undefined ? fromTypedValue(rawTypedValue) : null
        ) as T;

        for (const protoId of group.spatialIds) {
          const id = fromProtoSpatialId(protoId);
          yield { id, value: unpackedValue };
        }
      }
    }
  }

  /**
   * すべての結果を配列として収集して返す。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーの応答を解釈できないとき。
   */
  public async toArray(): Promise<ResultItem<T>[]> {
    const results: ResultItem<T>[] = [];
    for await (const item of this) {
      results.push(item);
    }
    return results;
  }

  /**
   * 結果を値ごとにグループ化し、`Map<value, SpatialId[]>` として返す。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーの応答を解釈できないとき。
   */
  public async toDictionaryMap(): Promise<Map<T, SpatialId[]>> {
    const map = new Map<T, SpatialId[]>();
    for await (const item of this) {
      const existing = map.get(item.value);
      if (existing) {
        existing.push(item.id);
      } else {
        map.set(item.value, [item.id]);
      }
    }
    return map;
  }
}
