import {EventEmitter} from "events"
import {Transform, Readable} from "stream"
import * as protocol from "typescript/lib/protocol"
import byline = require("byline")
import {BufferedNodeProcess} from "atom"
import {ChildProcess} from "child_process"

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

  /** Map of callbacks that are waiting for responses */
  callbacks: {
    [seq: number]: {
      name: string
      reject(err: Error): void
      resolve(res: protocol.Response): void
      started: number
    }
  } = {}

  private events = new EventEmitter()
  private seq = 0

  /** The tsserver child process */
  server: ChildProcess

  /** Promise that resolves when the server is ready to accept requests */
  serverPromise?: Promise<ChildProcess>

  /** Path to the tsserver executable */
  readonly tsServerPath: string
  readonly tsServerArgs = []
  readonly version: string

  constructor(tsServerPath: string, version: string) {
    this.tsServerPath = tsServerPath
    this.version = version
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

  private emitPendingRequests() {
    const pending: string[] = []

    for (const callback in this.callbacks) {
      pending.push(this.callbacks[callback].name)
    }

    this.events.emit("pendingRequestsChange", pending)
  }

  private onMessage = (res: protocol.Response | protocol.Event) => {
    if (isResponse(res)) {
      const callback = this.callbacks[res.request_seq]
      if (callback) {
        // console.log("received response for", res.command, "in", Date.now() - callback.started, "ms", "with data", res.body)
        delete this.callbacks[res.request_seq]
        if (res.success) {
          callback.resolve(res)
        } else {
          callback.reject(new Error(res.message))
        }

        this.emitPendingRequests()
      }
    } else if (isEvent(res)) {
      // console.log("received event", res)
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

    // console.log("sending request", command, "with args", args)

    setImmediate(() => {
      cp.stdin.write(JSON.stringify(req) + "\n")
    })

    if (expectResponse) {
      const resultPromise = new Promise((resolve, reject) => {
        this.callbacks[req.seq] = {name: command, resolve, reject, started: Date.now()}
      })

      this.emitPendingRequests()

      return resultPromise
    }
  }

  startServer() {
    if (!this.serverPromise) {
      this.serverPromise = new Promise<ChildProcess>((resolve, reject) => {
        // console.log("starting", this.tsServerPath)

        const cp = new BufferedNodeProcess({
          command: this.tsServerPath,
          args: this.tsServerArgs,
        }).process as any as ChildProcess

        cp.once("error", err => {
          console.log("tsserver failed with", err)
          reject(err)
        })

        cp.once("exit", code => {
          console.log("tsserver failed to start with code", code)
          reject({code})
        })

        messageStream(cp.stdout).on("data", this.onMessage)

        cp.stderr.on("data", data => console.warn("tsserver stderr:", data.toString()))

        // We send an unknown command to verify that the server is working.
        this.sendRequest(cp, "ping", null, true).then(res => resolve(cp), err => resolve(cp))
      })

      return this.serverPromise.catch(error => {
        this.serverPromise = undefined
        throw error
      })

    } else {
      throw new Error(`Server already started: ${this.tsServerPath}`)
    }
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
  lineCount = 1

  constructor() {
    super({objectMode: true})
  }

  _transform(line: string, encoding: string, callback: Function) {
    if (this.lineCount % 2 === 0) {
      this.push(JSON.parse(line))
    }

    this.lineCount += 1

    callback(null)
  }
}
