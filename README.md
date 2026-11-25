# spatial-id-ts
- 時空間IDの基礎的な型
- 時空間IDの集合とマップ（Wasm）

## import

モジュールごとのサブパスから import します。サブパスは API ドキュメントのモジュールと同じです。

| サブパス | 中身 |
| :--- | :--- |
| `@airbee-project/spatial-id/spatial-id` | `SingleId`、`RangeId`、`FlexId`、`ZoomLevel`、`SpatialIdError` |
| `@airbee-project/spatial-id/time` | `Interval`、`AllowedIntervals`、`TZoomLevel` |
| `@airbee-project/spatial-id/geometry` | `Coordinate`、`GeometryError` |
| `@airbee-project/spatial-id/collection` | `SpatialIdSet`、`SpatialIdMap`、`Query` |

`spatial-id`、`time`、`geometry` は、Wasm を読み込みません。

## 集合とマップ

```ts
import { SpatialIdMap, SpatialIdSet } from "@airbee-project/spatial-id/collection";
import { RangeId, SingleId } from "@airbee-project/spatial-id/spatial-id";

// 重なる ID を挿入しても、同じ場所を二重には持たない。
const set = new SpatialIdSet([RangeId.create(4, 3, [2, 3], 1)]);
set.get(SingleId.create(4, 3, 3, 1)); // 重なる部分を RangeId で返す

// 場所ごとに値を持つ。値は === で比べる。
using map = new SpatialIdMap<number>([[SingleId.create(4, 3, 2, 1), 10]]);
for (const [id, value] of map) {
  console.log(id.toString(), value);
}
```

`toJSON` と `fromJSON` で、[時空間データスキーマ](https://airbee-project.github.io/schemas/json/v1.0.json)の JSON と相互に変換できます。

```ts
const text = JSON.stringify(map);
const restored = SpatialIdMap.fromJSON<number>(JSON.parse(text));
```

`query()` で、集合やマップを入力にした `Query` を作れます。演算をつなげて組み立て、`get` や `toMap` を呼んだときに評価します。

```ts
// 値を X 方向へ減衰させながら広げ、重なりは大きい方を採る。さらに別のマップと足し合わせる。
const risk = map.query().falloffX(20, 5, "max").merge(other, "sum").toMap();
```

数値の演算（`falloffX`、`filterIn` など）と数値の規則（`sum`、`average` など）は、値が安全な整数のマップでだけ使えます。

[spatial-id-rs](https://github.com/AirBee-Project/spatial-id-rs) を Wasm にしたもので、Node、Bun、Deno、ブラウザで動きます。Cloudflare Workers では動きません。Wasm は最初にコンストラクターを呼んだときに同期で読み込むので、初期化を待つ必要はありません。

中身は Wasm のメモリに置き、GC で回収されたときに解放するので、後始末は要りません。大きな集合を作っては捨てることを繰り返すときは、`using` で宣言すると、スコープを抜けた時点で解放できます。

## 開発

```bash
bun install
bun run ci       # 型チェック、lint、テスト
bun run build
```

### Wasm の更新

`src/collection/wasm/gen` の Wasm は [spatial-id-rs](https://github.com/AirBee-Project/spatial-id-rs) の `main` から作り、使ったコミットを `wasm/spatial-id/Cargo.lock` に記録しています。次のコマンドで `main` の最新を取り直し、作り直します。

```bash
bun run generate
```

必要なもの:

- cargo と `wasm32-unknown-unknown` ターゲット（`rustup target add wasm32-unknown-unknown`）
- `wasm/spatial-id/Cargo.lock` と同じ版の wasm-bindgen-cli（違うとコマンドが版を示して止まります）
- wasm-opt（任意。あればサイズを縮めます）
