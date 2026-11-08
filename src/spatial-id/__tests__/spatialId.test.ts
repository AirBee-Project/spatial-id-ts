import { describe, expect, it } from "vitest";
import { Coordinate } from "../../geometry/coordinate.js";
import { Interval } from "../../time/interval.js";
import { FlexId } from "../flexId.js";
import { RangeId } from "../rangeId.js";
import { SingleId } from "../singleId.js";
import type { SpatialId } from "../spatialId.js";
import { SpatialIdBase } from "../spatialIdBase.js";
import { TZoomLevel, ZoomLevel } from "../zoomLevel.js";

describe("SpatialId 共通の振る舞い", () => {
  const single = SingleId.create(12, 0, 3638, 1614);
  const range = RangeId.create(12, [0, 1], [3638, 3639], [1614, 1615]);
  const flex = FlexId.create(12, 0, 12, 3638, 12, 1614);

  const allIds: SpatialId[] = [single, range, flex];

  it("すべての ID インスタンスが共通基底クラスを継承している", () => {
    for (const id of allIds) {
      expect(id).toBeInstanceOf(SpatialIdBase);
    }
  });

  it("toRangeId で RangeId へ変換できる", () => {
    for (const id of allIds) {
      const r = id.toRangeId();
      expect(r).toBeInstanceOf(RangeId);
      expect(r.z).toBe(12);
    }
  });

  it("singleIds で SingleId のイテレータを展開できる", () => {
    for (const id of allIds) {
      const singles = [...id.singleIds()];
      expect(singles.length).toBeGreaterThan(0);
      for (const s of singles) {
        expect(s).toBeInstanceOf(SingleId);
      }
    }
  });

  it("Iterable<FlexId> として for-of ループで走査できる", () => {
    for (const id of allIds) {
      const flexes = [...id];
      expect(flexes.length).toBeGreaterThan(0);
      for (const f of flexes) {
        expect(f).toBeInstanceOf(FlexId);
      }
    }
  });

  it("spatialCenter と spatialVertices が動作する", () => {
    for (const id of allIds) {
      const center = id.spatialCenter();
      expect(center.latitude).toBeDefined();
      expect(center.longitude).toBeDefined();
      expect(center.altitude).toBeDefined();

      expect(id.spatialVertices()).toHaveLength(8);
    }
  });

  it("時間系メソッド（timeIsWhole, timeRange, timeContains, withoutTime）が動作する", () => {
    const timedSingle = single.timeWith(Interval.HOUR, 10);
    const timedRange = range.timeWith(Interval.HOUR, 10);
    const timedFlex = flex.withTimeSegment(25, 7);

    for (const id of allIds) {
      expect(id.timeIsWhole()).toBe(true);
      expect(id.timeContains(0)).toBe(true);
      expect(id.timeContains(1000000)).toBe(true);
    }

    // Single と Range は 1 時間 (3600 秒) 単位
    const testTimeHour = 10 * 3600;
    for (const id of [timedSingle, timedRange]) {
      expect(id.timeIsWhole()).toBe(false);
      expect(id.timeContains(testTimeHour)).toBe(true);
      expect(id.timeContains(testTimeHour + 1800)).toBe(true);
      expect(id.timeContains(testTimeHour - 1)).toBe(false);
      expect(id.timeContains(testTimeHour + 3600)).toBe(false);

      const stripped = id.timeCleared();
      expect(stripped.timeIsWhole()).toBe(true);
    }

    // Flex は z=25 (1024 秒) 単位、t=7
    const flexUnit = 1024;
    const testTimeFlex = 7 * flexUnit;
    expect(timedFlex.timeIsWhole()).toBe(false);
    expect(timedFlex.timeContains(testTimeFlex)).toBe(true);
    expect(timedFlex.timeContains(testTimeFlex + 500)).toBe(true);
    expect(timedFlex.timeContains(testTimeFlex - 1)).toBe(false);
    expect(timedFlex.timeContains(testTimeFlex + flexUnit)).toBe(false);

    const strippedFlex = timedFlex.timeCleared();
    expect(strippedFlex.timeIsWhole()).toBe(true);
  });
});

describe("equals", () => {
  it("同じ値なら別のインスタンスでも true になる", () => {
    expect(
      SingleId.create(12, 0, 3638, 1614).equals(
        SingleId.create(12, 0, 3638, 1614),
      ),
    ).toBe(true);
    expect(
      RangeId.create(4, [-3, 6], [8, 9], [5, 10]).equals(
        RangeId.create(4, [-3, 6], [8, 9], [5, 10]),
      ),
    ).toBe(true);
    expect(
      FlexId.create(5, 3, 2, 3, 10, 1).equals(FlexId.create(5, 3, 2, 3, 10, 1)),
    ).toBe(true);
  });

  it("時間も含めて比べる", () => {
    const base = SingleId.create(12, 0, 3638, 1614);
    expect(base.timeWith(Interval.HOUR, 3).equals(base.timeWith(3600, 3))).toBe(
      true,
    );
    expect(
      base.timeWith(Interval.HOUR, 3).equals(base.timeWith(Interval.HOUR, 4)),
    ).toBe(false);
    expect(base.timeWith(Interval.HOUR, 3).equals(base)).toBe(false);
    const flex = FlexId.create(5, 3, 2, 3, 10, 1);
    expect(
      flex.withTimeSegment(25, 7).equals(flex.withTimeSegment(25, 7)),
    ).toBe(true);
    expect(
      flex.withTimeSegment(25, 7).equals(flex.withTimeSegment(24, 7)),
    ).toBe(false);
  });

  it("値が異なる、または型が異なる場合は false になる", () => {
    const single = SingleId.create(12, 0, 3638, 1614);
    expect(single.equals(SingleId.create(12, 0, 3638, 1615))).toBe(false);
    expect(single.equals(single.toRangeId())).toBe(false);
    expect(single.toRangeId().equals(single.toRangeId())).toBe(true);
  });

  it("値が等しければ toString も等しい", () => {
    const a = RangeId.create(4, [-3, 6], 8, [5, 10]);
    const b = RangeId.parse("4/-3:6/8/5:10");
    expect(a.equals(b)).toBe(true);
    expect(a.toString()).toBe(b.toString());
  });
});

describe("型に紐づく定数", () => {
  it("RangeId.WHOLE は全時空間を覆う", () => {
    expect(RangeId.WHOLE.toString()).toBe("0/-1:0/0/0");
    expect(RangeId.WHOLE.timeIsWhole()).toBe(true);
    expect(RangeId.WHOLE.equals(RangeId.create(0, [-1, 0], 0, 0))).toBe(true);
    expect([...RangeId.WHOLE].map((flex) => flex.toString())).toEqual([
      "0/-1|0/0|0/0",
      "0/0|0/0|0/0",
    ]);
  });

  it("FlexId.UPPER_MAX / LOWER_MAX は全空間の上半分・下半分を指す", () => {
    expect(FlexId.UPPER_MAX.toString()).toBe("0/0|0/0|0/0");
    expect(FlexId.LOWER_MAX.toString()).toBe("0/-1|0/0|0/0");
    expect(FlexId.UPPER_MAX.timeIsWhole()).toBe(true);
  });
});

describe("内部の検証なし生成と公開の生成が同じ結果になる", () => {
  it("RangeId の展開は create で作った SingleId / FlexId と一致する", () => {
    const range = RangeId.create(5, [-2, 3], [30, 1], [4, 6]).timeWith(
      Interval.HOUR,
      [2, 4],
    );
    const singles = [...range.singleIds()];
    expect(singles).toHaveLength(6 * 4 * 3 * 3);
    for (const single of singles) {
      const rebuilt = SingleId.create(
        single.z,
        single.f,
        single.x,
        single.y,
      ).timeWith(single.i, single.t);
      expect(single.equals(rebuilt)).toBe(true);
    }
    for (const flex of range) {
      const rebuilt = FlexId.create(
        flex.fZoomLevel,
        flex.fIndex,
        flex.xZoomLevel,
        flex.xIndex,
        flex.yZoomLevel,
        flex.yIndex,
      ).withTimeSegment(flex.tZoomLevel, flex.tIndex);
      expect(flex.equals(rebuilt)).toBe(true);
    }
  });

  it("toRangeId は create で作った RangeId と一致する", () => {
    const single = SingleId.create(12, -5, 3638, 1614).timeWith(1800, 100);
    expect(
      single
        .toRangeId()
        .equals(RangeId.create(12, -5, 3638, 1614).timeWith(1800, 100)),
    ).toBe(true);
    const flex = FlexId.create(5, 3, 2, 3, 10, 1).withTimeSegment(25, 7);
    const range = flex.toRangeId();
    expect(range.z).toBe(10);
    expect(range.i.seconds()).toBe(1024);
    expect(range.t).toEqual([7, 7]);
  });
});

describe("範囲の不変性", () => {
  it("RangeId の範囲は型の上で書き換えられない", () => {
    const range = RangeId.create(4, [0, 1], [2, 3], [4, 5]).timeWith(
      60,
      [1, 2],
    );
    // @ts-expect-error readonly な範囲への代入
    range.f[0] = 9;
    // @ts-expect-error readonly な範囲への代入
    range.t[1] = 9;
    const [start, end]: readonly [number, number] = range.timeRange();
    expect(end).toBeGreaterThan(start);
  });
});

describe("共有される定数の凍結", () => {
  it("定数とそのタプルは凍結されている", () => {
    expect(Object.isFrozen(RangeId.WHOLE)).toBe(true);
    expect(Object.isFrozen(RangeId.WHOLE.f)).toBe(true);
    expect(Object.isFrozen(RangeId.WHOLE.x)).toBe(true);
    expect(Object.isFrozen(RangeId.WHOLE.y)).toBe(true);
    expect(Object.isFrozen(RangeId.WHOLE.t)).toBe(true);
    expect(Object.isFrozen(FlexId.UPPER_MAX)).toBe(true);
    expect(Object.isFrozen(FlexId.LOWER_MAX)).toBe(true);
    expect(Object.isFrozen(Interval.WHOLE)).toBe(true);
    expect(Object.isFrozen(Interval.HOUR)).toBe(true);
    expect(Object.isFrozen(ZoomLevel.create(5))).toBe(true);
    expect(Object.isFrozen(TZoomLevel.create(5))).toBe(true);
  });

  it("型を迂回した書き換えは TypeError になり、値は変わらない", () => {
    expect(() => {
      (RangeId.WHOLE.f as unknown as number[])[0] = 9;
    }).toThrow(TypeError);
    expect(() => {
      (ZoomLevel.create(5) as { value: number }).value = 6;
    }).toThrow(TypeError);
    expect(() => {
      (Interval.HOUR as unknown as { value: number }).value = 1;
    }).toThrow(TypeError);
    expect(RangeId.WHOLE.toString()).toBe("0/-1:0/0/0");
    expect(ZoomLevel.create(5).value).toBe(5);
    expect(Interval.HOUR.seconds()).toBe(3600);
  });

  it("定数から派生した ID は凍結されない", () => {
    const derived = RangeId.WHOLE.timeWith(Interval.HOUR, 1);
    expect(Object.isFrozen(derived)).toBe(false);
    expect(derived.i.equals(Interval.HOUR)).toBe(true);
  });
});

describe("spatialVertices", () => {
  it("8頂点が高度・緯度・経度の順に並ぶ", () => {
    const id = SingleId.create(4, 6, 9, 14);
    const vertices = id.spatialVertices();
    expect(vertices).toHaveLength(8);

    // 緯度は y が小さい方が高いので、先頭の頂点は y 側の北端になる
    const [first, second, third, , fifth] = vertices;
    expect(first).toEqual(Coordinate.fromIndex(4, 6, 9, 14));
    expect(second).toEqual(Coordinate.fromIndex(4, 6, 10, 14));
    expect(third).toEqual(Coordinate.fromIndex(4, 6, 9, 15));
    expect(fifth).toEqual(Coordinate.fromIndex(4, 7, 9, 14));

    const unique = new Set(
      vertices.map((v) => `${v.latitude}/${v.longitude}/${v.altitude}`),
    );
    expect(unique.size).toBe(8);
  });

  it("RangeId と FlexId でも全体の範囲の角を返す", () => {
    const range = RangeId.create(5, [-2, 3], [4, 7], [8, 9]);
    const flex = FlexId.create(5, 3, 2, 3, 10, 1);
    for (const id of [range, flex]) {
      const r = id.toRangeId();
      const vertices = id.spatialVertices();
      const lats = vertices.map((v) => v.latitude);
      const lons = vertices.map((v) => v.longitude);
      const alts = vertices.map((v) => v.altitude);
      const corner = (f: number, x: number, y: number) =>
        Coordinate.fromIndex(r.z, f, x, y);
      expect(Math.max(...lats)).toBe(corner(0, 0, r.y[0]).latitude);
      expect(Math.min(...lats)).toBe(corner(0, 0, r.y[1] + 1).latitude);
      expect(Math.min(...lons)).toBe(corner(0, r.x[0], 0).longitude);
      expect(Math.max(...lons)).toBe(corner(0, r.x[1] + 1, 0).longitude);
      expect(Math.min(...alts)).toBe(corner(r.f[0], 0, 0).altitude);
      expect(Math.max(...alts)).toBe(corner(r.f[1] + 1, 0, 0).altitude);
    }
  });
});
