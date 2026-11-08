import {
  type Client,
  Code,
  ConnectError,
  createClient,
  type Transport,
} from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import {
  normalizeSpatialIds,
  toProtoOutputFormat,
  toProtoTableDataType,
} from "../proto/convert.js";
import { AuthService } from "../proto/gen/auth_pb.js";
import { DataService } from "../proto/gen/data_pb.js";
import type { DatabaseInfo } from "../proto/gen/database_pb.js";
import { DatabaseService } from "../proto/gen/database_pb.js";
import type { QueryNode } from "../proto/gen/query_pb.js";
import { QueryService } from "../proto/gen/query_pb.js";
import { TableService } from "../proto/gen/table_pb.js";
import type { SpatialId } from "../spatial-id/spatialId.js";
import { createAuthInterceptor } from "./auth.js";
import { DatabaseHandle } from "./database/handle.js";
import type { TableDataType } from "./database/types.js";
import { FailoverTransport } from "./failoverTransport.js";
import { type RpcCallOptions, toCallOptions } from "./options.js";
import { QueryBuilder } from "./query/builder.js";
import { ResultStream } from "./result/stream.js";
import type { OutputFormat } from "./result/types.js";
import { WasmTransport } from "./wasmTransport.js";

/**
 * Kasaneに接続するクライアント。
 */
export class KasaneClient {
  /** @internal */
  public readonly databaseClient: Client<typeof DatabaseService>;
  /** @internal */
  public readonly tableClient: Client<typeof TableService>;
  /** @internal */
  public readonly data: Client<typeof DataService>;
  /** @internal */
  private readonly queryClient: Client<typeof QueryService>;

  private readonly onLogout: () => void;

  private constructor(transport: Transport, onLogout: () => void = () => {}) {
    this.databaseClient = createClient(DatabaseService, transport);
    this.tableClient = createClient(TableService, transport);
    this.data = createClient(DataService, transport);
    this.queryClient = createClient(QueryService, transport);
    this.onLogout = onLogout;
  }

  /**
   * サーバーへ接続・認証し、利用可能な {@link KasaneClient} を返す。
   * トークン期限切れ時は内部で自動的に再認証が行われる。
   *
   * @param servers 接続先サーバーURL（文字列またはURL配列）
   * @param username ユーザー名
   * @param password パスワード
   *
   * @throws `ConnectError` 接続先が空のとき（`InvalidArgument`）。
   * @throws `ConnectError` 認証または通信に失敗したとき。
   */
  public static async connect(
    servers: string | string[],
    username: string,
    password: string,
  ): Promise<KasaneClient> {
    const serverList = Array.isArray(servers) ? servers : [servers];
    if (serverList.length === 0) {
      throw new ConnectError(
        "KasaneClient requires at least one server URL",
        Code.InvalidArgument,
      );
    }

    let token: string | undefined;
    const login = async (): Promise<string> => {
      token = (await auth.login({ username, password })).token;
      return token;
    };
    const transport = new FailoverTransport(
      serverList.map((baseUrl) =>
        createGrpcWebTransport({
          baseUrl,
          interceptors: [
            createAuthInterceptor({
              getToken: () => token,
              refreshToken: login,
            }),
          ],
        }),
      ),
    );
    const auth = createClient(AuthService, transport);

    await login();
    return new KasaneClient(transport, () => {
      token = undefined;
    });
  }

  /**
   * プロセス内で動くインメモリの Kasane（Wasm）を作り、それにつながる {@link KasaneClient} を返す。
   * データはこのクライアントだけが持ち、利用者は root 固定なので認証は要らない。
   */
  public static async inMemory(): Promise<KasaneClient> {
    const { createKasane } = await import("#kasane-wasm");
    return new KasaneClient(new WasmTransport(await createKasane()));
  }

  /**
   * 指定したデータベースに対する操作スコープ（{@link DatabaseHandle}）を取得する。
   */
  public database(name: string): DatabaseHandle {
    return new DatabaseHandle(this, name);
  }

  /**
   * データベースを新規作成する。
   *
   * @param name データベース名
   * @param description データベースの説明文
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async createDatabase(
    name: string,
    description?: string,
  ): Promise<DatabaseInfo> {
    return await this.databaseClient.create({
      name,
      description,
    });
  }

  /**
   * データベース一覧を取得する。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async listDatabases(options?: {
    rpcCallOptions?: RpcCallOptions;
  }): Promise<DatabaseInfo[]> {
    const res = await this.databaseClient.list(
      {},
      toCallOptions(options?.rpcCallOptions),
    );
    return res.databases;
  }

  /**
   * Queryを実行し、結果ストリームとして取得する。
   *
   * @param query 実行する空間クエリ
   * @param spatialIds 対象となる空間ID（単一または配列）
   * @param options 追加オプション（出力値の型、フォーマット、中断シグナル等）
   */
  public query<T = unknown>(
    query: QueryBuilder | QueryNode,
    spatialIds: SpatialId | SpatialId[],
    options?: {
      valueType?: TableDataType;
      format?: OutputFormat;
      rpcCallOptions?: RpcCallOptions;
    },
  ): ResultStream<T> {
    const queryNode = query instanceof QueryBuilder ? query.toProto() : query;
    const rawStream = this.queryClient.execute(
      {
        query: queryNode,
        spatialIds: normalizeSpatialIds(spatialIds),
        valueType:
          options?.valueType !== undefined
            ? toProtoTableDataType(options.valueType)
            : undefined,
        format: toProtoOutputFormat(options?.format),
      },
      toCallOptions(options?.rpcCallOptions),
    );
    return new ResultStream<T>(rawStream);
  }

  /** 保持しているトークンを破棄する。以降の呼び出しは未認証状態になる。 */
  public logout(): void {
    this.onLogout();
  }
}
