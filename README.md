# Kasane-TypeScript
- 時空間IDの基礎的な型
- [Kasane v0.7](https://github.com/AirBee-Project/Kasane)との接続機能
- インメモリの Kasane（Wasm）
- 時空間IDの集合とマップ（Wasm）

## import

モジュールごとのサブパスから import します。サブパスは API ドキュメントのモジュールと同じです。

| サブパス | 中身 |
| :--- | :--- |
| `@airbee-project/kasane-client/spatial-id` | `SingleId`、`RangeId`、`FlexId`、`ZoomLevel`、`SpatialIdError` |
| `@airbee-project/kasane-client/time` | `Interval`、`AllowedIntervals`、`TZoomLevel` |
| `@airbee-project/kasane-client/geometry` | `Coordinate`、`GeometryError` |
| `@airbee-project/kasane-client/collection` | `SpatialIdSet`、`SpatialIdMap` |
| `@airbee-project/kasane-client/client` | `KasaneClient`、通信エラーの判定関数 |
| `@airbee-project/kasane-client/client/database` | `DatabaseHandle`、`TableHandle`、テーブルの型 |
| `@airbee-project/kasane-client/client/query` | `query`、`QueryBuilder` |
| `@airbee-project/kasane-client/client/result` | `ResultStream` |

`spatial-id`、`time`、`geometry` は、Connect や Wasm を読み込みません。

## 接続

```ts
import { KasaneClient } from "@airbee-project/kasane-client/client";

// grpc-web で Kasane サーバーにつなぐ。複数の URL を渡すと、接続できないサーバーを飛ばす。
const client = await KasaneClient.connect("http://localhost:5172", "root", "password");

// プロセス内で動くインメモリの Kasane。データはこのクライアントだけが持ち、利用者は root 固定。
const local = await KasaneClient.inMemory();
```

`inMemory()` は Node、Bun、Deno、ブラウザ、Cloudflare Workers で動きます。Workers では Wrangler が `workerd` 条件で `.wasm` を別モジュールとして読み込み、それ以外の環境では JS に埋め込んだ Wasm を使います。

## 集合とマップ

```ts
import { SpatialIdMap, SpatialIdSet } from "@airbee-project/kasane-client/collection";
import { RangeId, SingleId } from "@airbee-project/kasane-client/spatial-id";

// 重なる ID を挿入しても、同じ場所を二重には持たない。
const set = new SpatialIdSet([RangeId.create(4, 3, [2, 3], 1)]);
set.get(SingleId.create(4, 3, 3, 1)); // 重なる部分を RangeId で返す

// 場所ごとに値を持つ。値は === で比べる。
using map = new SpatialIdMap<number>([[SingleId.create(4, 3, 2, 1), 10]]);
for (const [id, value] of map) {
  console.log(id.toString(), value);
}
```

[spatial-id-rs](https://github.com/AirBee-Project/spatial-id-rs) を Wasm にしたもので、Node、Bun、Deno、ブラウザで動きます。Cloudflare Workers では動きません。Wasm は最初にコンストラクターを呼んだときに同期で読み込むので、初期化を待つ必要はありません。

中身は Wasm のメモリに置き、GC で回収されたときに解放するので、後始末は要りません。大きな集合を作っては捨てることを繰り返すときは、`using` で宣言すると、スコープを抜けた時点で解放できます。

## 開発

```bash
bun install
bun run ci       # 型チェック、lint、テスト
bun run build
```

LMDB 版の Kasane サーバー（root のパスワードは `password`）を起動し、`KASANE_URL` に URL を渡すと、サーバーと Wasm 版で同じ操作の結果を比べるテストも動きます。

```bash
KASANE_URL=http://localhost:5172 bun run test
```

### 生成コードと Wasm の更新

生成コードは Rust の crate の `main` から作ります。

| 対象 | 生成先 | crate | 使ったコミットの記録 |
| :--- | :--- | :--- | :--- |
| `kasane` | `src/proto/gen`（proto から生成した TypeScript）、`src/client/wasm/gen`（Wasm） | Kasane | `wasm/kasane/Cargo.lock` |
| `spatial-id` | `src/collection/wasm/gen`（Wasm） | spatial-id-rs | `wasm/spatial-id/Cargo.lock` |

次のコマンドで `main` の最新を取り直し、作り直します。対象を指定すると、その対象だけを作り直します。`kasane` の2つの生成先は同じコミットから作ります。

```bash
bun run generate              # すべて
bun run generate spatial-id   # spatial-id だけ
```

必要なもの:

- cargo と `wasm32-unknown-unknown` ターゲット（`rustup target add wasm32-unknown-unknown`）
- protoc（`kasane` のみ）
- 各 `Cargo.lock` と同じ版の wasm-bindgen-cli（違うとコマンドが版を示して止まります）
- wasm-opt（任意。あればサイズを縮めます）
