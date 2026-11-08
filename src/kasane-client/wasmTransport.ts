import {
  create,
  type DescMessage,
  type DescMethod,
  type DescMethodStreaming,
  type DescMethodUnary,
  fromBinary,
  type MessageInitShape,
  type MessageShape,
  toBinary,
} from "@bufbuild/protobuf";
import {
  Code,
  ConnectError,
  type StreamResponse,
  type Transport,
  type UnaryResponse,
} from "@connectrpc/connect";

/** `wasm/kasane/` から作る Wasm 版 `Kasane` のうち、Transport が使う部分。 */
export interface InMemoryKasane {
  handle(method: string, request: Uint8Array): Uint8Array[];
}

/**
 * インメモリの Kasane（Wasm）を呼ぶ {@link Transport}。
 *
 * 呼び出しは同期的に完了するので、`signal` と `timeoutMs` は使わない。
 */
export class WasmTransport implements Transport {
  private readonly kasane: InMemoryKasane;

  constructor(kasane: InMemoryKasane) {
    this.kasane = kasane;
  }

  async unary<I extends DescMessage, O extends DescMessage>(
    method: DescMethodUnary<I, O>,
    _signal: AbortSignal | undefined,
    _timeoutMs: number | undefined,
    _header: HeadersInit | undefined,
    input: MessageInitShape<I>,
  ): Promise<UnaryResponse<I, O>> {
    const [message] = this.call(method, input);
    return {
      stream: false,
      service: method.parent,
      method,
      header: new Headers(),
      trailer: new Headers(),
      message: message as MessageShape<O>,
    };
  }

  async stream<I extends DescMessage, O extends DescMessage>(
    method: DescMethodStreaming<I, O>,
    _signal: AbortSignal | undefined,
    _timeoutMs: number | undefined,
    _header: HeadersInit | undefined,
    input: AsyncIterable<MessageInitShape<I>>,
  ): Promise<StreamResponse<I, O>> {
    // Kasane のストリームはサーバーストリームだけなので、リクエストは 1 件。
    let request: MessageInitShape<I> | undefined;
    for await (const message of input) {
      request = message;
      break;
    }
    if (request === undefined) {
      throw new ConnectError(
        "a request message is required",
        Code.InvalidArgument,
      );
    }
    const messages = this.call(method, request) as MessageShape<O>[];
    return {
      stream: true,
      service: method.parent,
      method,
      header: new Headers(),
      trailer: new Headers(),
      message: (async function* () {
        yield* messages;
      })(),
    };
  }

  private call<I extends DescMessage>(
    method: DescMethod & { input: I },
    input: MessageInitShape<I>,
  ): MessageShape<DescMessage>[] {
    const request = toBinary(method.input, create(method.input, input));
    let responses: Uint8Array[];
    try {
      responses = this.kasane.handle(
        `/${method.parent.typeName}/${method.name}`,
        request,
      );
    } catch (err) {
      throw toConnectError(err);
    }
    return responses.map((bytes) => fromBinary(method.output, bytes));
  }
}

function toConnectError(err: unknown): ConnectError {
  if (err instanceof Error && "code" in err && typeof err.code === "number") {
    return new ConnectError(
      err.message,
      err.code as Code,
      undefined,
      undefined,
      err,
    );
  }
  return new ConnectError(
    String(err),
    Code.Internal,
    undefined,
    undefined,
    err,
  );
}
