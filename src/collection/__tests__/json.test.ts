import { describe, expect, it } from "vitest";
import { SpatialIdError } from "../../spatial-id/error.js";
import { RangeId } from "../../spatial-id/rangeId.js";
import { SingleId } from "../../spatial-id/singleId.js";
import { Interval } from "../../time/interval.js";
import { SpatialIdMap } from "../spatialIdMap.js";
import { SpatialIdSet } from "../spatialIdSet.js";

const envelope = {
  $schema: "https://airbee-project.github.io/schemas/json/v1.0.json",
  meta: { version: "v1.0", description: "" },
  option: {},
};

/** 内部の分け方によらず比べられるよう、時間方向をつなげた ID の文字列にする。 */
function contents(set: SpatialIdSet): string[] {
  return set.reconstructedTimeRanges().map(String).sort();
}

/** 文字列を経由して往復させる。 */
function roundTrip<T>(value: unknown, parse: (json: never) => T): T {
  return parse(JSON.parse(JSON.stringify(value)) as never);
}

describe("SpatialIdSet の JSON", () => {
  it("スキーマの形で書き出し、単一の値は1要素にする", () => {
    const set = new SpatialIdSet([RangeId.create(20, 0, [0, 1], 0)]);
    expect(set.toJSON()).toEqual({
      ...envelope,
      data: [{ name: "", ids: [{ z: 20, f: [0], x: [0, 1], y: [0] }] }],
    });
  });

  it("空の集合は ids が空になる", () => {
    expect(new SpatialIdSet().toJSON().data).toEqual([{ name: "", ids: [] }]);
  });

  it("経度の周期境界をまたぐ x を往復できる", () => {
    const set = new SpatialIdSet([RangeId.create(2, 0, [3, 0], 0)]);
    expect(contents(roundTrip(set, SpatialIdSet.fromJSON))).toEqual(
      contents(set),
    );
  });

  it("隣り合う1時間×2は、i を 3600、t を範囲にして書き出す", () => {
    const base = SingleId.create(12, 0, 3638, 1614);
    const set = new SpatialIdSet([
      base.timeWith(Interval.HOUR, 0),
      base.timeWith(Interval.HOUR, 1),
    ]);
    expect(set.toJSON().data[0]?.ids).toEqual([
      { z: 12, f: [0], x: [3638], y: [1614], i: 3600, t: [0, 1] },
    ]);
    expect(contents(roundTrip(set, SpatialIdSet.fromJSON))).toEqual(
      contents(set),
    );
  });

  it("暦にない 1800 秒は分の単位で書き出し、秒区間は変わらない", () => {
    const original = SingleId.create(12, 0, 3638, 1614).timeWith(1800, 809712);
    const set = new SpatialIdSet([original]);
    expect(set.toJSON().data[0]?.ids).toEqual([
      {
        z: 12,
        f: [0],
        x: [3638],
        y: [1614],
        i: 60,
        t: [24291360, 24291389],
      },
    ]);
    expect(contents(roundTrip(set, SpatialIdSet.fromJSON))).toEqual(
      contents(set),
    );
  });

  it("f、x、y を省くと、その軸の全範囲として読む", () => {
    const set = SpatialIdSet.fromJSON({
      meta: { version: "v1.0" },
      data: [{ name: "", ids: [{ z: 1 }] }],
    });
    const expected = new SpatialIdSet([
      RangeId.create(1, [-2, 1], [0, 1], [0, 1]),
    ]);
    expect(contents(set)).toEqual(contents(expected));
  });

  it("data がちょうど1件でなければ TypeError を投げる", () => {
    expect(() => SpatialIdSet.fromJSON({ ...envelope, data: [] })).toThrow(
      TypeError,
    );
  });

  it("要素数が 1、2 以外の組は TypeError を投げる", () => {
    const json = {
      ...envelope,
      data: [{ name: "", ids: [{ z: 20, f: [0, 1, 2] }] }],
    };
    expect(() => SpatialIdSet.fromJSON(json as never)).toThrow(TypeError);
  });

  it("i と t の片方だけがあると TypeError を投げる", () => {
    const json = { ...envelope, data: [{ name: "", ids: [{ z: 1, i: 60 }] }] };
    expect(() => SpatialIdSet.fromJSON(json)).toThrow(TypeError);
  });

  it("範囲外のズームレベルは SpatialIdError を投げる", () => {
    const json = { ...envelope, data: [{ name: "", ids: [{ z: 68 }] }] };
    expect(() => SpatialIdSet.fromJSON(json)).toThrow(SpatialIdError);
  });
});

describe("SpatialIdMap の JSON", () => {
  it("値は重複を除いて value に並べ、ref で指す", () => {
    const map = new SpatialIdMap<number>([
      [SingleId.create(20, 0, 0, 0), 10],
      [SingleId.create(20, 1, 0, 0), 20],
      [SingleId.create(20, 2, 0, 0), 10],
    ]);
    const [data] = map.toJSON().data;
    expect(data?.value).toEqual([10, 20]);
    expect(data?.ids.map((id) => data.value?.[id.ref as number])).toEqual(
      [...map].map(([, value]) => value),
    );
  });

  it("空のマップは value と ids が空になる", () => {
    expect(new SpatialIdMap().toJSON().data).toEqual([
      { name: "", value: [], ids: [] },
    ]);
  });

  it("値と ID を往復できる", () => {
    const map = new SpatialIdMap<string>([
      [SingleId.create(20, 0, 0, 0), 'a"b'],
      [SingleId.create(20, 1, 0, 0), "c"],
    ]);
    const restored = roundTrip(map, SpatialIdMap.fromJSON<string>);
    expect([...restored].map(([id, v]) => [String(id), v])).toEqual(
      [...map].map(([id, v]) => [String(id), v]),
    );
  });

  it("同じ ref を指すオブジェクトの値は、隣り合えば1つにまとまる", () => {
    const map = SpatialIdMap.fromJSON<{ kind: string }>({
      ...envelope,
      data: [
        {
          name: "",
          value: [{ kind: "rain" }],
          ids: [
            { z: 20, f: [0], x: [0], y: [0], ref: 0 },
            { z: 20, f: [1], x: [0], y: [0], ref: 0 },
          ],
        },
      ],
    });
    expect(map.count()).toBe(1);
  });

  it("ref が value の範囲外なら TypeError を投げる", () => {
    const json = {
      ...envelope,
      data: [{ name: "", value: [10], ids: [{ z: 20, ref: 1 }] }],
    };
    expect(() => SpatialIdMap.fromJSON(json)).toThrow(TypeError);
  });

  it("ref がなければ TypeError を投げる", () => {
    const json = {
      ...envelope,
      data: [{ name: "", value: [10], ids: [{ z: 20 }] }],
    };
    expect(() => SpatialIdMap.fromJSON(json)).toThrow(TypeError);
  });
});
