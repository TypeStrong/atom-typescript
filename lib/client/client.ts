// tslint:disable:max-classes-per-file
import * as protocol from "typescript/lib/protocol"
import {CommandArgResponseMap, CommandArg, CommandRes} from "./commandArgsResponseMap"
import {BufferedNodeProcess, BufferedProcess, Emitter} from "atom"
import {Callbacks} from "./callbacks"
import {ChildProcess} from "child_process"
import {Transform, Readable} from "stream"
import byline = require("byline")
import {EventTypes} from "./events"

// Set this to true to start tsserver with node --inspect
const INSPECT_TSSERVER = false

type CommandArgResponseKeysWithArgs = {
  [K in keyof CommandArgResponseMap]: CommandRes<K> extends void ? never : K
}[keyof CommandArgResponseMap]

const commandWithResponseMap: {readonly [K in CommandArgResponseKeysWithArgs]: true} = {
  compileOnSaveAffectedFileList: true,
  compileOnSaveEmitFile: true,
  completionEntryDetails: true,
  completions: true,
  configure: true,
  definition: true,
  format: true,
  getCodeFixes: true,
  getSupportedCodeFixes: true,
  occurrences: true,
  projectInfo: true,
  quickinfo: true,
  references: true,
  reload: true,
  rename: true,
  navtree: true,
  navto: true,
  getApplicableRefactors: true,
  getEditsForRefactor: true,
  ping: true,
  organizeImports: true,
}

const commandWithResponse = new Set(Object.keys(commandWithResponseMap))

export class TypescriptServiceClient {
  /** Callbacks that are waiting for responses */
  private readonly callbacks: Callbacks

  private readonly emitter = new Emitter<{}, EventTypes>()
  private seq = 0

  private readonly serverPromise: Promise<ChildProcess>
  private running = false
  private lastStderrOutput = ""

  constructor(public tsServerPath: string, public version: string) {
    this.callbacks = new Callbacks(this.emitPendingRequests)
    this.serverPromise = this.startServer()
  }

  public async execute<T extends keyof CommandArgResponseMap>(
    command: T,
    args: CommandArg<T>,
  ): Promise<CommandRes<T>> {
    if (!this.running) {
      throw new Error("Server is not running")
    }

    return this.sendRequest(await this.serverPromise, command, args)
  }

  public on<T extends keyof EventTypes>(name: T, listener: (result: EventTypes[T]) => void) {
    return this.emitter.on(name, listener)
  }

  private startServer() {
    return new Promise<ChildProcess>((resolve, reject) => {
      this.running = true
      if (window.atom_typescript_debug) {
        console.log("starting", this.tsServerPath)
      }

      const cp = startServer(this.tsServerPath)

      const h = this.exitHandler(reject)
      if (!cp) {
        h(new Error("ChildProcess failed to start"))
        return
      }

      cp.once("error", h)
      cp.once("exit", (code: number | null, signal: string | null) => {
        if (code !== null) h(new Error(`exited with code: ${code}`))
        else if (signal !== null) h(new Error(`terminated on signal: ${signal}`))
      })

      // Pipe both stdout and stderr appropriately
      messageStream(cp.stdout).on("data", this.onMessage)
      cp.stderr.on("data", data => {
        console.warn("tsserver stderr:", (this.lastStderrOutput = data.toString()))
      })

      this.sendRequest(cp, "ping", undefined).then(() => resolve(cp), () => resolve(cp))
    })
  }

  private exitHandler = (reject: (err: Error) => void) => (err: Error) => {
    console.error("tsserver: ", err)
    this.callbacks.rejectAll(err)
    this.emitter.dispose()
    reject(err)
    this.running = false

    setImmediate(() => {
      let detail = err.message
      if (this.lastStderrOutput) {
        detail = `Last output from tsserver:\n${this.lastStderrOutput}\n\n${detail}`
      }
      atom.notifications.addError("TypeScript quit unexpectedly", {
        detail,
        stack: err.stack,
        dismissable: true,
      })
    })
  }

  private emitPendingRequests = (pending: string[]) => {
    this.emitter.emit("pendingRequestsChange", pending)
  }

  private onMessage = (res: protocol.Response | protocol.Event) => {
    if (res.type === "response") this.onResponse(res)
    else this.onEvent(res)
  }

  private onResponse(res: protocol.Response) {
    const req = this.callbacks.remove(res.request_seq)
    if (req) {
      if (window.atom_typescript_debug) {
        console.log(
          "received response for",
          res.command,
          "in",
          Date.now() - req.started,
          "ms",
          "with data",
          res.body,
        )
      }

      if (res.success) {
        req.resolve(res)
      } else {
        req.reject(new Error(res.message))
      }
    } else {
      console.warn("unexpected response:", res)
    }
  }

  private onEvent(res: protocol.Event) {
    if (window.atom_typescript_debug) {
      console.log("received event", res)
    }

    // tslint:disable-next-line:no-unsafe-any
    if (res.body) this.emitter.emit(res.event as keyof EventTypes, res.body)
  }

  private async sendRequest<T extends keyof CommandArgResponseMap>(
    cp: ChildProcess,
    command: T,
    args: CommandArg<T>,
  ): Promise<CommandRes<T>> {
    const expectResponse = commandWithResponse.has(command)
    const req = {
      seq: this.seq++,
      command,
      arguments: args,
    }

    if (window.atom_typescript_debug) {
      console.log("sending request", command, "with args", args)
    }

    setImmediate(() => {
      try {
        cp.stdin.write(JSON.stringify(req) + "\n")
      } catch (error) {
        const callback = this.callbacks.remove(req.seq)
        if (callback) {
          callback.reject(error as Error)
        } else {
          console.error(error)
        }
      }
    })

    if (expectResponse) {
      return this.callbacks.add(req.seq, command) as CommandRes<T>
    } else {
      return undefined as CommandRes<T>
    }
  }
}

function startServer(tsServerPath: string): ChildProcess | undefined {
  const locale = atom.config.get("atom-typescript.locale")
  const tsServerArgs: string[] = locale ? ["--locale", locale] : []
  if (INSPECT_TSSERVER) {
    return new BufferedProcess({
      command: "node",
      args: ["--inspect", tsServerPath].concat(tsServerArgs),
    }).process
  } else {
    return new BufferedNodeProcess({
      command: tsServerPath,
      args: tsServerArgs,
    }).process
  }
}

function messageStream(input: Readable) {
  return input.pipe(byline()).pipe(new MessageStream())
}

/** Helper to parse the tsserver output stream to a message stream  */
class MessageStream extends Transform {
  constructor() {
    super({objectMode: true})
  }

  public _transform(buf: Buffer, _encoding: string, callback: (n: null) => void) {
    const line = buf.toString()

    try {
      if (line.startsWith("{")) {
        this.push(JSON.parse(line))
      } else if (!line.startsWith("Content-Length:")) {
        console.warn(line)
      }
    } catch (error) {
      console.error("client: failed to parse: ", line)
    } finally {
      callback(null)
    }
  }
}
