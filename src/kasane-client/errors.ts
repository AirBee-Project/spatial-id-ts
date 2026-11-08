import { Code, ConnectError } from "@connectrpc/connect";

/** 通信層のエラー（`ConnectError`）かを判定する。`code` で原因を判別できる。 */
export function isConnectError(err: unknown): err is ConnectError {
  return err instanceof ConnectError;
}

/** リソースが見つからないエラー (`Code.NotFound`) か判定する。 */
export function isNotFoundError(err: unknown): boolean {
  return isConnectError(err) && err.code === Code.NotFound;
}

/** 権限不足エラー (`Code.PermissionDenied`) か判定する。 */
export function isPermissionDeniedError(err: unknown): boolean {
  return isConnectError(err) && err.code === Code.PermissionDenied;
}

/** 未認証・認証切れエラー (`Code.Unauthenticated`) か判定する。 */
export function isUnauthenticatedError(err: unknown): boolean {
  return isConnectError(err) && err.code === Code.Unauthenticated;
}

/** 既に存在するエラー (`Code.AlreadyExists`) か判定する。 */
export function isAlreadyExistsError(err: unknown): boolean {
  return isConnectError(err) && err.code === Code.AlreadyExists;
}

/** 接続不能・サーバー利用不可エラー (`Code.Unavailable`) か判定する。 */
export function isUnavailableError(err: unknown): boolean {
  return isConnectError(err) && err.code === Code.Unavailable;
}

/** 不正な引数エラー (`Code.InvalidArgument`) か判定する。 */
export function isInvalidArgumentError(err: unknown): boolean {
  return isConnectError(err) && err.code === Code.InvalidArgument;
}
