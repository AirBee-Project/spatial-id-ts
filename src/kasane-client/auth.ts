import { Code, ConnectError, type Interceptor } from "@connectrpc/connect";
import { AuthService } from "../proto/gen/auth_pb.js";

export interface AuthInterceptorOptions {
  /** 現在保持しているトークンを返す関数。 */
  getToken: () => string | undefined;
  /**
   * `Code.Unauthenticated` 受信時に呼び出される再認証コールバック。
   * 新しいトークンを返すと、リクエストにそのトークンを付与して1回再試行する。
   */
  refreshToken?: (() => Promise<string | undefined>) | undefined;
}

/**
 * 呼び出しごとに `getToken()` の結果を `Authorization: Bearer <token>` として付与する
 * インターセプタ。
 * `refreshToken` が設定されている場合、`Code.Unauthenticated` エラーを受信した際に
 * 自動でトークンを更新して再試行する。
 */
export function createAuthInterceptor(
  options: AuthInterceptorOptions | (() => string | undefined),
): Interceptor {
  const opts: AuthInterceptorOptions =
    typeof options === "function" ? { getToken: options } : options;

  return (next) => async (req) => {
    const token = opts.getToken();
    if (token !== undefined) {
      req.header.set("Authorization", `Bearer ${token}`);
    }

    try {
      return await next(req);
    } catch (err) {
      // 再認証そのものが Unauthenticated になると、再認証を呼び続けて返らなくなる。
      if (
        err instanceof ConnectError &&
        err.code === Code.Unauthenticated &&
        req.service.typeName !== AuthService.typeName &&
        opts.refreshToken
      ) {
        const newToken = await opts.refreshToken();
        if (newToken) {
          req.header.set("Authorization", `Bearer ${newToken}`);
          return await next(req);
        }
      }
      throw err;
    }
  };
}
