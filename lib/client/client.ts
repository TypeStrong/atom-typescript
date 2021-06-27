// tslint:disable:max-classes-per-file
import {BufferedNodeProcess, BufferedProcess, Emitter} from "atom"
import byline from "byline"
import {ChildProcess} from "child_process"
import {Readable, Transform} from "stream"
import protocol from "typescript/lib/protocol"
import {ReportBusyWhile} from "../main/pluginManager"
import {Callbacks} from "./callbacks"
import {
  AllTSClientCommands,
  CommandArg,
  CommandRes,
  CommandsWithMultistep,
  CommandsWithResponse,
} from "./commandArgsResponseMap"
import {DiagnosticEventTypes} from "./events"

// Set this to true to start tsserver with node --inspect
const INSPECT_TSSERVER = false

const commandWithResponseMap: {readonly [K in CommandsWithResponse]: true} = {
  compileOnSaveAffectedFileList: true,
  compileOnSaveEmitFile: true,
  completionEntryDetails: true,
  completions: true,
  completionInfo: true,
  configure: true,
  definition: true,
  format: true,
  getCodeFixes: true,
  getSupportedCodeFixes: true,
  documentHighlights: true,
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
  getEditsForFileRename: true,
  applyCodeActionCommand: true,
}

const commandsWithMultistepMap: {readonly [K in CommandsWithMultistep]: true} = {
  geterr: true,
  geterrForProject: true,
}

const eventTypesMap: {readonly [K in keyof DiagnosticEventTypes]: true} = {
  configFileDiag: true,
  semanticDiag: true,
  suggestionDiag: true,
  syntaxDiag: true,
}

const commandWithResponse = new Set<string>(Object.keys(commandWithResponseMap))
const commandWithMultistep = new Set<string>(Object.keys(commandsWithMultistepMap))
const eventTypes = new Set<string>(Object.keys(eventTypesMap))

function isCommandWithResponse(command: AllTSClientCommands): command is CommandsWithResponse {
  return commandWithResponse.has(command)
}

function isCommandWithMultistep(command: AllTSClientCommands): command is CommandsWithMultistep {
  return commandWithMultistep.has(command)
}

function isKnownDiagEventType(event: string): event is keyof DiagnosticEventTypes {
  return eventTypes.has(event)
}

export class TypescriptServiceClient {
  public readonly multistepSupported: boolean
  /** Callbacks that are waiting for responses */
  private readonly callbacks: Callbacks

  private readonly emitter = new Emitter<
    {
      restarted: void
      terminated: void
    },
    DiagnosticEventTypes
  >()
  private seq = 0

  private server?: ChildProcess
  private lastStderrOutput = ""

  // tslint:disable-next-line:member-ordering
  public on = this.emitter.on.bind(this.emitter)

  constructor(
    public tsServerPath: string,
    public version: string,
    private reportBusyWhile: ReportBusyWhile,
  ) {
    // multistep completion event is supported as of TS version 2.2
    const [major, minor] = version
      .split(".")
      .slice(0, 2)
      .map((x) => parseInt(x, 10))
    this.multistepSupported = major > 2 || (major === 2 && minor >= 2)

    this.callbacks = new Callbacks(this.reportBusyWhile)
    this.server = this.startServer()
  }

  public async execute<T extends AllTSClientCommands>(
    command: T,
    ...args: CommandArg<T>
  ): Promise<CommandRes<T>> {
    if (!this.server) {
      this.server = this.startServer()
      this.emitter.emit("restarted")
    }

    const req = {
      seq: this.seq++,
      command,
      arguments: args[0],
    }

    if (window.atom_typescript_debug) {
      console.log("sending request", req)
    }

    let result: CommandRes<T> | Promise<CommandRes<T>> = undefined as CommandRes<T>
    if (
      isCommandWithResponse(command) ||
      (this.multistepSupported && isCommandWithMultistep(command))
    ) {
      result = this.callbacks.add(req.seq, command)
    }

    try {
      if (!this.server.stdin) throw new Error("Server stdin is missing")
      this.server.stdin.write(JSON.stringify(req) + "\n")
    } catch (error) {
      this.callbacks.error(req.seq, error as Error)
    }
    return result
  }

  public async restartServer() {
    await this.stopServer()
    // can't guarantee this.server value after await
    if (!this.server) {
      this.server = this.startServer()
      this.emitter.emit("restarted")
    }
  }

  public async destroy() {
    const terminated = new Promise<void>((resolve) => {
      const disp = this.emitter.once("terminated", () => {
        this.emitter.dispose()
        disp.dispose()
        resolve()
      })
    })
    return Promise.all([terminated, this.stopServer()])
  }

  private async stopServer() {
    if (this.server) {
      const server = this.server
      const graceTimer = setTimeout(() => server.kill(), 10000)
      await Promise.all([
        this.execute("exit"),
        new Promise<void>((resolve) => {
          const disp = this.emitter.once("terminated", () => {
            disp.dispose()
            resolve()
          })
        }),
      ])
      clearTimeout(graceTimer)
    }
  }

  private startServer() {
    if (window.atom_typescript_debug) {
      console.log("starting", this.tsServerPath)
    }

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
    if (!cp.stdout) throw new Error("ChildProcess stdout missing")
    if (!cp.stderr) throw new Error("ChildProcess stderr missing")
    messageStream(cp.stdout).on("data", this.onMessage)
    cp.stderr.on("data", (data: Buffer) => {
      console.warn("tsserver stderr:", (this.lastStderrOutput = data.toString()))
    })
    return cp
  }

  private exitHandler = (err: Error, report = true) => {
    this.callbacks.rejectAll(err)
    if (report) console.error("tsserver: ", err)
    this.server = undefined
    this.emitter.emit("terminated")

    if (report) {
      let detail = err.message
      if (this.lastStderrOutput) {
        detail = `Last output from tsserver:\n${this.lastStderrOutput}\n\n${detail}`
      }
      atom.notifications.addError("TypeScript server quit unexpectedly", {
        detail,
        stack: err.stack,
        dismissable: true,
      })
    }
  }

  private onMessage = (res: protocol.Response | protocol.Event) => {
    if (res.type === "response") this.callbacks.resolve(res)
    else this.onEvent(res)
  }

  private onEvent(res: protocol.Event) {
    if (window.atom_typescript_debug) {
      console.log("received event", res)
    }

    if (res.body) {
      if (isKnownDiagEventType(res.event)) {
        this.emitter.emit(res.event, res.body as DiagnosticEventTypes[keyof DiagnosticEventTypes])
      } else if (res.event === "requestCompleted") {
        this.callbacks.resolveMS(res.body as protocol.RequestCompletedEventBody)
      }
    }
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

  public _transform(buf: Buffer, _encoding: string, callback: (n: Error | undefined) => void) {
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
      callback(undefined)
    }
  }
}
