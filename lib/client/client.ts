// tslint:disable:max-classes-per-file
import {BufferedNodeProcess, BufferedProcess, Emitter} from "atom"
import byline = require("byline")
import {ChildProcess} from "child_process"
import {Readable, Transform} from "stream"
import * as protocol from "typescript/lib/protocol"
import {ReportBusyWhile} from "../main/pluginManager"
import {Callbacks} from "./callbacks"
import {
  AllTSClientCommands,
  CommandArg,
  CommandRes,
  CommandsWithResponse,
} from "./commandArgsResponseMap"
import {EventTypes} from "./events"

// Set this to true to start tsserver with node --inspect
const INSPECT_TSSERVER = false

const commandWithResponseMap: {readonly [K in CommandsWithResponse]: true} = {
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
  organizeImports: true,
  signatureHelp: true,
}

const commandWithResponse = new Set(Object.keys(commandWithResponseMap))

function isCommandWithResponse(command: AllTSClientCommands): command is CommandsWithResponse {
  return commandWithResponse.has(command)
}

export class TypescriptServiceClient {
  /** Callbacks that are waiting for responses */
  private readonly callbacks: Callbacks

  private readonly emitter = new Emitter<
    {
      restarted: void
    },
    EventTypes
  >()
  private seq = 0

  private server?: ChildProcess
  private lastStderrOutput = ""
  private lastStartAttempt?: number

  // tslint:disable-next-line:member-ordering
  public on = this.emitter.on.bind(this.emitter)

  constructor(
    public tsServerPath: string,
    public version: string,
    private reportBusyWhile: ReportBusyWhile,
  ) {
    this.callbacks = new Callbacks(this.reportBusyWhile)
    this.server = this.startServer()
  }

  public async execute<T extends AllTSClientCommands>(
    command: T,
    ...args: CommandArg<T>
  ): Promise<CommandRes<T>> {
    if (!this.server) {
      throw new Error("Server is not running")
    }

    const req = {
      seq: this.seq++,
      command,
      arguments: args[0],
    }

    if (window.atom_typescript_debug) {
      console.log("sending request", command, "with args", args)
    }

    const result = isCommandWithResponse(command)
      ? this.callbacks.add(req.seq, command)
      : (undefined as CommandRes<T>)

    try {
      this.server.stdin.write(JSON.stringify(req) + "\n")
    } catch (error) {
      this.callbacks.error(req.seq, error as Error)
    }
    return result
  }

  public async restartServer() {
    if (this.server) {
      this.lastStartAttempt = undefined // reset auto-restart loop guard
      const server = this.server
      const graceTimer = setTimeout(() => server.kill(), 10000)
      await this.execute("exit")
      clearTimeout(graceTimer)
    } else {
      this.server = this.startServer()
      this.emitter.emit("restarted", undefined)
    }
  }

  private startServer() {
    if (window.atom_typescript_debug) {
      console.log("starting", this.tsServerPath)
    }

    this.lastStartAttempt = Date.now()
    const cp = startServer(this.tsServerPath)

    if (!cp) throw new Error("ChildProcess failed to start")

    const h = this.exitHandler
    cp.once("error", h)
    cp.once("exit", (code: number | null, signal: string | null) => {
      if (code === 0) h(new Error("Server stopped normally"), false)
      else if (code !== null) h(new Error(`exited with code: ${code}`))
      else if (signal !== null) h(new Error(`terminated on signal: ${signal}`))
    })

    // Pipe both stdout and stderr appropriately
    messageStream(cp.stdout).on("data", this.onMessage)
    cp.stderr.on("data", data => {
      console.warn("tsserver stderr:", (this.lastStderrOutput = data.toString()))
    })
    return cp
  }

  private exitHandler = (err: Error, report = true) => {
    this.callbacks.rejectAll(err)
    if (report) console.error("tsserver: ", err)
    this.server = undefined

    if (report) {
      let detail = err.message
      if (this.lastStderrOutput) {
        detail = `Last output from tsserver:\n${this.lastStderrOutput}\n\n${detail}`
      }
      atom.notifications.addError("TypeScript quit unexpectedly", {
        detail,
        stack: err.stack,
        dismissable: true,
      })
    }
    if (this.lastStartAttempt === undefined || Date.now() - this.lastStartAttempt > 5000) {
      this.server = this.startServer()
      this.emitter.emit("restarted", undefined)
    } else {
      atom.notifications.addWarning("Not restarting tsserver", {
        detail: "Restarting too fast",
      })
    }
  }

  private onMessage = (res: protocol.Response | protocol.Event) => {
    if (res.type === "response") this.onResponse(res)
    else this.onEvent(res)
  }

  private onResponse(res: protocol.Response) {
    this.callbacks.resolve(res.request_seq, res)
  }

  private onEvent(res: protocol.Event) {
    if (window.atom_typescript_debug) {
      console.log("received event", res)
    }

    // tslint:disable-next-line:no-unsafe-any
    if (res.body) this.emitter.emit(res.event as keyof EventTypes, res.body)
  }
}

function startServer(tsServerPath: string): ChildProcess | undefined {
  const locale = atom.config.get("atom-typescript").locale
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
