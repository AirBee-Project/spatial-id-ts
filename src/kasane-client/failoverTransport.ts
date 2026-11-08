import type {
  DescMessage,
  DescMethodStreaming,
  DescMethodUnary,
  MessageInitShape,
} from "@bufbuild/protobuf";
import type {
  ContextValues,
  StreamResponse,
  Transport,
  UnaryResponse,
} from "@connectrpc/connect";
import { Code, ConnectError } from "@connectrpc/connect";

/**
 * 複数サーバーへ接続できる冗長化用の {@link Transport}。
 *
 * 接続できないサーバーだけ次のサーバーへ切り替える。権限エラーなど、サーバーが応答した上でのアプリケーションレベルのエラーはフェイルオーバーせずそのまま呼び出し元へ伝える。 一度成功したサーバーは、次に失敗するまで優先して使い続ける。
 */
export class FailoverTransport implements Transport {
  private readonly transports: readonly Transport[];
  private currentIndex = 0;

  constructor(transports: readonly Transport[]) {
    if (transports.length === 0) {
      throw new ConnectError(
        "FailoverTransport requires at least one transport",
        Code.InvalidArgument,
      );
    }
    this.transports = transports;
  }

  unary<I extends DescMessage, O extends DescMessage>(
    method: DescMethodUnary<I, O>,
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    header: HeadersInit | undefined,
    input: MessageInitShape<I>,
    contextValues?: ContextValues,
  ): Promise<UnaryResponse<I, O>> {
    return this.withFailover((transport) =>
      transport.unary(method, signal, timeoutMs, header, input, contextValues),
    );
  }

  stream<I extends DescMessage, O extends DescMessage>(
    method: DescMethodStreaming<I, O>,
    signal: AbortSignal | undefined,
    timeoutMs: number | undefined,
    header: HeadersInit | undefined,
    input: AsyncIterable<MessageInitShape<I>>,
    contextValues?: ContextValues,
  ): Promise<StreamResponse<I, O>> {
    return this.withFailover((transport) =>
      transport.stream(method, signal, timeoutMs, header, input, contextValues),
    );
  }

  private async withFailover<T>(
    call: (transport: Transport) => Promise<T>,
  ): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < this.transports.length; attempt++) {
      const transport = this.transports[this.currentIndex] as Transport;
      try {
        return await call(transport);
      } catch (err) {
        lastError = err;
        if (!isConnectivityFailure(err)) {
          throw err;
        }
        this.currentIndex = (this.currentIndex + 1) % this.transports.length;
      }
    }
    throw lastError;
  }
}

function isConnectivityFailure(err: unknown): boolean {
  if (!(err instanceof ConnectError)) {
    return true;
  }
  // connect-web は fetch の失敗（接続の拒否など）を、fetch が投げた Error を cause に持つ Unknown で返す。
  // サーバーが返したエラーには cause が付かない。fetch が投げる型は実行環境で違う（Node は TypeError、Bun 1.3 は Error）。
  return (
    err.code === Code.Unavailable ||
    (err.code === Code.Unknown && err.cause instanceof Error)
  );
}
