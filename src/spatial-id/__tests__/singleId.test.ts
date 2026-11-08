import { describe, expect, it } from "vitest";
import { Interval } from "../../time/interval.js";
import { SpatialIdError } from "../error.js";
import { FlexId } from "../flexId.js";
import { SingleId } from "../singleId.js";

describe("SingleId.create（生成と検証）", () => {
  it("z/f/x/yを指定して作成し、時間は全時間から始まる", () => {
    const id = SingleId.create(5, 3, 2, 10);
    expect(id.z).toBe(5);
    expect(id.f).toBe(3);
    expect(id.x).toBe(2);
    expect(id.y).toBe(10);
    expect(id.i).toBe(Interval.WHOLE);
    expect(id.t).toBe(0);
  });

  it("ズームレベルが範囲外ならエラーを投げる", () => {
    expect(() => SingleId.create(68, 3, 2, 10)).toThrow(SpatialIdError);
  });

  it("f/x/yが範囲外ならエラーを投げる", () => {
    expect(() => SingleId.create(3, 3, 2, 10)).toThrow(SpatialIdError);
  });
});

describe("SingleId.createUnchecked（検証なしの生成）", () => {
  it("検証を行わずに値をそのまま保持する", () => {
    const id = SingleId.createUnchecked(5, 3, 2, 10);
    expect(id.z).toBe(5);
    expect(id.f).toBe(3);
    expect(id.x).toBe(2);
    expect(id.y).toBe(10);
    expect(id.i).toBe(Interval.WHOLE);
    expect(id.t).toBe(0);
  });
});

describe("SingleId.withTime（時間区間の設定）", () => {
  it("仕様書の例(12/0/3638/1614_1800/809712)と一致する", () => {
    const id = SingleId.create(12, 0, 3638, 1614).timeWith(1800, 809712);
    expect(id.i.seconds()).toBe(1800);
    expect(id.t).toBe(809712);
  });

  it("Interval定数と等価な秒数のリテラルのどちらでも渡せる", () => {
    const byConst = SingleId.create(4, 0, 1, 1).timeWith(Interval.HOUR, 3);
    const byLiteral = SingleId.create(4, 0, 1, 1).timeWith(3600, 3);
    expect(byConst.i.seconds()).toBe(byLiteral.i.seconds());
    expect(byConst.t).toBe(byLiteral.t);
  });

  it("0秒の間隔はエラーを投げる", () => {
    expect(() => SingleId.create(5, 3, 2, 10).timeWith(0, 0)).toThrow(
      SpatialIdError,
    );
  });
});

describe("SingleId.toRangeId（RangeIdへの変換）", () => {
  it("各軸が[v, v]に退化した範囲になる", () => {
    const range = SingleId.create(5, 3, 2, 10).toRangeId();
    expect(range.z).toBe(5);
    expect(range.f).toEqual([3, 3]);
    expect(range.x).toEqual([2, 2]);
    expect(range.y).toEqual([10, 10]);
  });

  it("i/tはそのまま引き継がれる", () => {
    const single = SingleId.create(5, 3, 2, 10).timeWith(1800, 5);
    const range = single.toRangeId();
    expect(range.i.seconds()).toBe(1800);
    expect(range.t).toEqual([5, 5]);
  });
});

describe("SingleId（FlexIdイテレータとしての展開）", () => {
  it("時間間隔が2の冪ならFlexIdは1個だけ", () => {
    const single = SingleId.create(5, 3, 2, 10).timeWith(1024, 7);
    const flexes = [...single];
    expect(flexes).toHaveLength(1);
    const [flex] = flexes;
    expect(flex).toBeInstanceOf(FlexId);
    expect(flex?.tZoomLevel).toBe(25); // 2^(35-25) = 1024
    expect(flex?.tIndex).toBe(7);
  });

  it("2の冪でない間隔は複数のFlexIdへちょうど分解される", () => {
    const single = SingleId.create(4, 0, 0, 0).timeWith(1800, 4);
    const flexes = [...single];
    expect(flexes.length).toBeGreaterThan(1);

    const totalSeconds = flexes.reduce(
      (sum, f) => sum + 2 ** (35 - f.tZoomLevel),
      0,
    );
    expect(totalSeconds).toBe(1800);
  });
});

describe("SingleId.toString（文字列化）", () => {
  it("全時間のSingleIdを{z}/{f}/{x}/{y}形式で出力する", () => {
    const id = SingleId.create(5, 3, 2, 10);
    expect(id.toString()).toBe("5/3/2/10");
  });

  it("時間付きのSingleIdを{z}/{f}/{x}/{y}_{i}/{t}形式で出力する", () => {
    const id = SingleId.create(12, 0, 3638, 1614).timeWith(1800, 809712);
    expect(id.toString()).toBe("12/0/3638/1614_1800/809712");
  });

  it("テンプレートリテラルで自動的に文字列化される", () => {
    const id = SingleId.create(5, 3, 2, 10);
    expect(`${id}`).toBe("5/3/2/10");
  });
});

describe("SingleId.parse（文字列からの復元）", () => {
  it("全時間の文字列表現から正しく復元できる", () => {
    const id = SingleId.parse("5/3/2/10");
    expect(id.z).toBe(5);
    expect(id.f).toBe(3);
    expect(id.x).toBe(2);
    expect(id.y).toBe(10);
    expect(id.timeIsWhole()).toBe(true);
  });

  it("時間付き文字列表現から正しく復元できる", () => {
    const id = SingleId.parse("12/0/3638/1614_1800/809712");
    expect(id.z).toBe(12);
    expect(id.f).toBe(0);
    expect(id.x).toBe(3638);
    expect(id.y).toBe(1614);
    expect(id.i.seconds()).toBe(1800);
    expect(id.t).toBe(809712);
  });

  it("toString()の出力をparse()で元通り復元できる（ラウンドトリップ）", () => {
    const original = SingleId.create(12, 0, 3638, 1614).timeWith(1800, 809712);
    const restored = SingleId.parse(original.toString());
    expect(restored.z).toBe(original.z);
    expect(restored.f).toBe(original.f);
    expect(restored.x).toBe(original.x);
    expect(restored.y).toBe(original.y);
    expect(restored.i.seconds()).toBe(original.i.seconds());
    expect(restored.t).toBe(original.t);
  });

  it("構文不正な文字列はParseSpatialIdFormatエラーを投げる", () => {
    expect(() => SingleId.parse("invalid")).toThrow(SpatialIdError);
    expect(() => SingleId.parse("5/3/2")).toThrow(SpatialIdError);
    expect(() => SingleId.parse("5/3/2/10/1")).toThrow(SpatialIdError);
    expect(() => SingleId.parse("5/3/2/10_")).toThrow(SpatialIdError);
    expect(() => SingleId.parse("5/3/2/10_1800")).toThrow(SpatialIdError);
    expect(() => SingleId.parse("5/3/2/10_1800/1/2")).toThrow(SpatialIdError);
    expect(() => SingleId.parse("5/3/2/10_1800/0:2")).toThrow(SpatialIdError);
    expect(() => SingleId.parse("5/a/2/10")).toThrow(SpatialIdError);
  });

  it("範囲外の値を含む文字列は該当の検証エラーを投げる", () => {
    expect(() => SingleId.parse("68/3/2/10")).toThrow(SpatialIdError);
    expect(() => SingleId.parse("3/3/2/10")).toThrow(SpatialIdError);
  });
});
