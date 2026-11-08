import {
  fromProtoTableInfo,
  normalizeSpatialIds,
  toProtoOutputFormat,
  toProtoTableDataType,
  toProtoZoomLevelPolicy,
  toTypedValue,
} from "../../proto/convert.js";
import type { TableConstraints } from "../../proto/gen/common_pb.js";
import type { DatabaseInfo } from "../../proto/gen/database_pb.js";
import type { SpatialId } from "../../spatial-id/spatialId.js";
import type { KasaneClient } from "../client.js";
import { type RpcCallOptions, toCallOptions } from "../options.js";
import { ResultStream } from "../result/stream.js";
import type { OutputFormat } from "../result/types.js";
import type {
  PrimitiveValue,
  TableDataType,
  TableInfo,
  ZoomLevelPolicy,
} from "./types.js";

/**
 * 特定のテーブルに対する操作を行うスコープ付きハンドル。
 */
export class TableHandle<T extends PrimitiveValue = PrimitiveValue> {
  private readonly client: KasaneClient;
  /** テーブルが属するデータベースの名前。 */
  public readonly dbName: string;
  /** テーブル名。 */
  public readonly tableName: string;

  /** @internal */
  constructor(client: KasaneClient, dbName: string, tableName: string) {
    this.client = client;
    this.dbName = dbName;
    this.tableName = tableName;
  }

  /**
   * テーブルにデータを挿入する。既存データと重複がある場合は上書き。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   * @throws `ConnectError` 値の型が対応していないとき（`InvalidArgument`）。
   */
  public async insert(
    value: T,
    ids: SpatialId | SpatialId[],
    policy?: ZoomLevelPolicy,
  ): Promise<void> {
    await this.client.data.insert({
      dbName: this.dbName,
      tableName: this.tableName,
      value: toTypedValue(value),
      spatialIds: normalizeSpatialIds(ids),
      zoomLevelPolicy: toProtoZoomLevelPolicy(policy),
    });
  }

  /**
   * テーブルにデータを更新または挿入する。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   * @throws `ConnectError` 値の型が対応していないとき（`InvalidArgument`）。
   */
  public async upsert(
    value: T,
    ids: SpatialId | SpatialId[],
    policy?: ZoomLevelPolicy,
  ): Promise<void> {
    await this.client.data.upsert({
      dbName: this.dbName,
      tableName: this.tableName,
      value: toTypedValue(value),
      spatialIds: normalizeSpatialIds(ids),
      zoomLevelPolicy: toProtoZoomLevelPolicy(policy),
    });
  }

  /**
   * テーブルから指定された空間IDのデータを削除する。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async remove(
    ids: SpatialId | SpatialId[],
    policy?: ZoomLevelPolicy,
  ): Promise<void> {
    await this.client.data.remove({
      dbName: this.dbName,
      tableName: this.tableName,
      spatialIds: normalizeSpatialIds(ids),
      zoomLevelPolicy: toProtoZoomLevelPolicy(policy),
    });
  }

  /**
   * 指定された空間IDに合致するデータを検索する。
   * 通信エラーは、返された {@link ResultStream} を走査したときに投げられる。
   */
  public search(
    ids: SpatialId | SpatialId[],
    options?: {
      policy?: ZoomLevelPolicy;
      format?: OutputFormat;
      rpcCallOptions?: RpcCallOptions;
    },
  ): ResultStream<T> {
    const rawStream = this.client.data.search(
      {
        dbName: this.dbName,
        tableName: this.tableName,
        spatialIds: normalizeSpatialIds(ids),
        zoomLevelPolicy: toProtoZoomLevelPolicy(options?.policy),
        format: toProtoOutputFormat(options?.format),
      },
      toCallOptions(options?.rpcCallOptions),
    );
    return new ResultStream<T>(rawStream);
  }

  /**
   * テーブルの詳細情報を取得する。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async info(): Promise<TableInfo> {
    const res = await this.client.tableClient.get({
      dbName: this.dbName,
      tableName: this.tableName,
    });
    return fromProtoTableInfo(res);
  }

  /**
   * テーブルを削除する。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async delete(): Promise<void> {
    await this.client.tableClient.delete({
      dbName: this.dbName,
      tableName: this.tableName,
    });
  }
}

/**
 * 特定のデータベースに対する操作を行うスコープ付きハンドル。
 */
export class DatabaseHandle {
  private readonly client: KasaneClient;
  /** データベース名。 */
  public readonly name: string;

  /** @internal */
  constructor(client: KasaneClient, name: string) {
    this.client = client;
    this.name = name;
  }

  /** 配下のテーブルハンドルを取得する。 */
  public table<T extends PrimitiveValue = PrimitiveValue>(
    tableName: string,
  ): TableHandle<T> {
    return new TableHandle<T>(this.client, this.name, tableName);
  }

  /**
   * テーブルを新規作成する。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async createTable(
    name: string,
    dataType: TableDataType,
    maxZoomLevel: number,
    options?: {
      constraints?: TableConstraints;
      description?: string;
      isTemporal?: boolean;
    },
  ): Promise<TableInfo> {
    const res = await this.client.tableClient.create({
      dbName: this.name,
      name,
      dataType: toProtoTableDataType(dataType),
      maxZoomLevel,
      constraints: options?.constraints,
      description: options?.description,
      isTemporal: options?.isTemporal ?? false,
    });
    return fromProtoTableInfo(res);
  }

  /**
   * テーブル一覧を取得する。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async listTables(options?: {
    rpcCallOptions?: RpcCallOptions;
  }): Promise<TableInfo[]> {
    const res = await this.client.tableClient.list(
      { dbName: this.name },
      toCallOptions(options?.rpcCallOptions),
    );
    return res.tables.map(fromProtoTableInfo);
  }

  /**
   * データベースの詳細情報を取得する。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async info(): Promise<DatabaseInfo> {
    return await this.client.databaseClient.get({ dbName: this.name });
  }

  /**
   * データベースと配下のテーブルを削除する。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async delete(): Promise<void> {
    await this.client.databaseClient.delete({ dbName: this.name });
  }

  /**
   * データベースの名前または説明文を更新し、更新後の情報を返す。
   *
   * @throws `ConnectError` 通信に失敗したとき、またはサーバーがエラーを返したとき。
   */
  public async update(options: {
    newName?: string;
    description?: string | null;
  }): Promise<DatabaseInfo> {
    const descriptionUpdate: Parameters<
      typeof this.client.databaseClient.update
    >[0]["descriptionUpdate"] =
      options.description === null
        ? { case: "clearDescription", value: true }
        : options.description !== undefined
          ? { case: "setDescription", value: options.description }
          : { case: undefined };

    return await this.client.databaseClient.update({
      dbName: this.name,
      newName: options.newName,
      descriptionUpdate,
    });
  }
}
