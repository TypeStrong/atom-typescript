import * as protocol from "typescript/lib/protocol"
import {BufferedNodeProcess, BufferedProcess} from "atom"
import {Callbacks} from "./callbacks"
import {ChildProcess} from "child_process"
import {EventEmitter} from "events"
import {Transform, Readable} from "stream"
import byline = require("byline")

// Set this to true to start tsserver with node --inspect
const INSPECT_TSSERVER = false

export const CommandWithResponse = new Set([
  "compileOnSaveAffectedFileList",
  "compileOnSaveEmitFile",
  "completionEntryDetails",
  "completions",
  "configure",
  "definition",
  "format",
  "occurrences",
  "projectInfo",
  "quickinfo",
  "references",
  "reload",
  "rename",
])

export class TypescriptServiceClient {

  /** Callbacks that are waiting for responses */
  callbacks: Callbacks

  private events = new EventEmitter()
  private seq = 0

  /** The tsserver child process */
  server: ChildProcess

  /** Promise that resolves when the server is ready to accept requests */
  serverPromise?: Promise<ChildProcess>

  /** Extra args passed to the tsserver executable */
  readonly tsServerArgs: string[] = []

  constructor(public tsServerPath: string, public version: string) {
    this.callbacks = new Callbacks(this.emitPendingRequests)
  }

  executeChange(args: protocol.ChangeRequestArgs): Promise<undefined> {
    return this.execute("change", args)
  }
  executeClose(args: protocol.FileRequestArgs): Promise<undefined> {
    return this.execute("close", args)
  }
  executeCompileOnSaveAffectedFileList(args: protocol.FileRequestArgs): Promise<protocol.CompileOnSaveAffectedFileListResponse> {
    return this.execute("compileOnSaveAffectedFileList", args)
  }
  executeCompileOnSaveEmitFile(args: protocol.CompileOnSaveEmitFileRequestArgs): Promise<protocol.Response & {body: boolean}> {
    return this.execute("compileOnSaveEmitFile", args)
  }
  executeCompletions(args: protocol.CompletionsRequestArgs): Promise<protocol.CompletionsResponse> {
    return this.execute("completions", args)
  }
  executeCompletionDetails(args: protocol.CompletionDetailsRequestArgs): Promise<protocol.CompletionDetailsResponse> {
    return this.execute("completionEntryDetails", args)
  }
  executeConfigure(args: protocol.ConfigureRequestArguments): Promise<undefined> {
    return this.execute("configure", args)
  }
  executeDefinition(args: protocol.FileLocationRequestArgs): Promise<protocol.DefinitionResponse> {
    return this.execute("definition", args)
  }
  executeFormat(args: protocol.FormatRequestArgs): Promise<protocol.FormatResponse> {
    return this.execute("format", args)
  }
  executeGetErr(args: protocol.GeterrRequestArgs): Promise<undefined> {
    return this.execute("geterr", args)
  }
  executeGetErrForProject(args: protocol.GeterrForProjectRequestArgs): Promise<undefined> {
    return this.execute("geterrForProject", args)
  }
  executeOccurances(args: protocol.FileLocationRequestArgs): Promise<protocol.OccurrencesResponse> {
    return this.execute("occurrences", args)
  }
  executeOpen(args: protocol.OpenRequestArgs): Promise<undefined> {
    return this.execute("open", args)
  }
  executeProjectInfo(args: protocol.ProjectInfoRequestArgs): Promise<protocol.ProjectInfoResponse> {
    return this.execute("projectInfo", args)
  }
  executeQuickInfo(args: protocol.FileLocationRequestArgs): Promise<protocol.QuickInfoResponse> {
    return this.execute("quickinfo", args)
  }
  executeReferences(args: protocol.FileLocationRequestArgs): Promise<protocol.ReferencesResponse> {
    return this.execute("references", args)
  }
  executeReload(args: protocol.ReloadRequestArgs): Promise<protocol.ReloadResponse> {
    return this.execute("reload", args)
  }
  executeRename(args: protocol.RenameRequestArgs): Promise<protocol.RenameResponse> {
    return this.execute("rename", args)
  }
  executeSaveTo(args: protocol.SavetoRequestArgs) {
    return this.execute("saveto", args)
  }

  private async execute(command: string, args: any) {
    if (!this.serverPromise) {
      throw new Error("Server is not running")
    }

    return this.sendRequest(await this.serverPromise, command, args, CommandWithResponse.has(command))
  }

  /** Adds an event listener for tsserver or other events. Returns an unsubscribe function */
  on(name: "configFileDiag", listener: (result: protocol.DiagnosticEventBody) => any): Function
  on(name: "pendingRequestsChange", listener: (requests: string[]) => any): Function
  on(name: "semanticDiag", listener: (result: protocol.DiagnosticEventBody) => any): Function
  on(name: "syntaxDiag", listener: (result: protocol.DiagnosticEventBody) => any): Function
  on(name: string, listener: (result: any) => any): Function {
    this.events.on(name, listener)

    return () => {
      this.events.removeListener(name, listener)
    }
  }

  private emitPendingRequests = (pending: string[]) => {
    this.events.emit("pendingRequestsChange", pending)
  }

  private onMessage = (res: protocol.Response | protocol.Event) => {
    if (isResponse(res)) {
      const req = this.callbacks.remove(res.request_seq)
      if (req) {
        if (window.atom_typescript_debug) {
          console.log("received response for", res.command, "in", Date.now() - req.started, "ms", "with data", res.body)
        }

        if (res.success) {
          req.resolve(res)
        } else {
          req.reject(new Error(res.message))
        }
      } else {
        console.warn("unexpected response:", res)
      }
    } else if (isEvent(res)) {
      if (window.atom_typescript_debug) {
        console.log("received event", res)
      }

      this.events.emit(res.event, res.body)
    }
  }

  private sendRequest(cp: ChildProcess, command: string, args: any, expectResponse: true): Promise<protocol.Response>
  private sendRequest(cp: ChildProcess, command: string, args: any, expectResponse: false): undefined
  private sendRequest(cp: ChildProcess, command: string, args: any, expectResponse: boolean): Promise<protocol.Response> | undefined
  private sendRequest(cp: ChildProcess, command: string, args: any, expectResponse: boolean): Promise<protocol.Response> | undefined {

    const req = {
      seq: this.seq++,
      command,
      arguments: args
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
          callback.reject(error)
        } else {
          console.error(error)
        }
      }
    })

    if (expectResponse) {
      return this.callbacks.add(req.seq, command)
    }
  }

  startServer() {
    if (!this.serverPromise) {
      let lastStderrOutput: string
      let reject: (err: Error) => void

      const exitHandler = (result: Error | number) => {
        const err = typeof result === "number" ?
          new Error("exited with code: " + result) : result

          console.error("tsserver: ", err)
          this.callbacks.rejectAll(err)
          reject(err)
          this.serverPromise = undefined

          setImmediate(() => {
            let detail = err && err.stack || ""

            if (lastStderrOutput) {
              detail = "Last output from tsserver:\n" + lastStderrOutput + "\n \n" + detail
            }

            atom.notifications.addError("Typescript quit unexpectedly", {
              detail,
              dismissable: true,
            })
          })
      }

      return this.serverPromise = new Promise<ChildProcess>((resolve, _reject) => {
        reject = _reject

        if (window.atom_typescript_debug) {
          console.log("starting", this.tsServerPath)
        }

        const cp = startServer(this.tsServerPath, this.tsServerArgs)

        cp.once("error", exitHandler)
        cp.once("exit", exitHandler)

        // Pipe both stdout and stderr appropriately
        messageStream(cp.stdout).on("data", this.onMessage)
        cp.stderr.on("data", data => {
          console.warn("tsserver stderr:", lastStderrOutput = data.toString())
        })

        // We send an unknown command to verify that the server is working.
        this.sendRequest(cp, "ping", null, true).then(res => resolve(cp), err => resolve(cp))
      })

    } else {
      throw new Error(`Server already started: ${this.tsServerPath}`)
    }
  }
}

function startServer(tsServerPath: string, tsServerArgs: string[]): ChildProcess {
  if (INSPECT_TSSERVER) {
    return new BufferedProcess({
      command: "node",
      args: ["--inspect", tsServerPath].concat(tsServerArgs),
    }).process as any
  } else {
    return new BufferedNodeProcess({
      command: tsServerPath,
      args: tsServerArgs
    }).process as any
  }
}

function isEvent(res: protocol.Response | protocol.Event): res is protocol.Event {
  return res.type === "event"
}

function isResponse(res: protocol.Response | protocol.Event): res is protocol.Response {
  return res.type === "response"
}

function messageStream(input: Readable) {
  return input.pipe(byline()).pipe(new MessageStream())
}

/** Helper to parse the tsserver output stream to a message stream  */
class MessageStream extends Transform {
  constructor() {
    super({objectMode: true})
  }

  _transform(buf: Buffer, encoding: string, callback: Function) {
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
