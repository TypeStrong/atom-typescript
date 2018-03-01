// tslint:disable:max-classes-per-file
import * as protocol from "typescript/lib/protocol"
import {BufferedNodeProcess, BufferedProcess} from "atom"
import {Callbacks} from "./callbacks"
import {ChildProcess} from "child_process"
import {EventEmitter} from "events"
import {Transform, Readable} from "stream"
import byline = require("byline")

// Set this to true to start tsserver with node --inspect
const INSPECT_TSSERVER = false

const commandWithResponse = new Set([
  "compileOnSaveAffectedFileList",
  "compileOnSaveEmitFile",
  "completionEntryDetails",
  "completions",
  "configure",
  "definition",
  "format",
  "getCodeFixes",
  "getSupportedCodeFixes",
  "occurrences",
  "projectInfo",
  "quickinfo",
  "references",
  "reload",
  "rename",
  "navtree",
  "navto",
])

export class TypescriptServiceClient {
  /** Callbacks that are waiting for responses */
  private callbacks: Callbacks

  private events = new EventEmitter()
  private seq = 0

  /** Promise that resolves when the server is ready to accept requests */
  private serverPromise?: Promise<ChildProcess>

  constructor(public tsServerPath: string, public version: string) {
    this.callbacks = new Callbacks(this.emitPendingRequests)
  }

  public executeChange(args: protocol.ChangeRequestArgs): Promise<undefined> {
    return this.execute("change", args)
  }
  public executeClose(args: protocol.FileRequestArgs): Promise<undefined> {
    return this.execute("close", args)
  }
  public executeCompileOnSaveAffectedFileList(
    args: protocol.FileRequestArgs,
  ): Promise<protocol.CompileOnSaveAffectedFileListResponse> {
    return this.execute("compileOnSaveAffectedFileList", args)
  }
  public executeCompileOnSaveEmitFile(
    args: protocol.CompileOnSaveEmitFileRequestArgs,
  ): Promise<protocol.Response> {
    return this.execute("compileOnSaveEmitFile", args)
  }
  public executeCompletions(
    args: protocol.CompletionsRequestArgs,
  ): Promise<protocol.CompletionsResponse> {
    return this.execute("completions", args)
  }
  public executeCompletionDetails(
    args: protocol.CompletionDetailsRequestArgs,
  ): Promise<protocol.CompletionDetailsResponse> {
    return this.execute("completionEntryDetails", args)
  }
  public executeConfigure(args: protocol.ConfigureRequestArguments): Promise<undefined> {
    return this.execute("configure", args)
  }
  public executeDefinition(
    args: protocol.FileLocationRequestArgs,
  ): Promise<protocol.DefinitionResponse> {
    return this.execute("definition", args)
  }
  public executeFormat(args: protocol.FormatRequestArgs): Promise<protocol.FormatResponse> {
    return this.execute("format", args)
  }
  public executeGetCodeFixes(
    args: protocol.CodeFixRequestArgs,
  ): Promise<protocol.GetCodeFixesResponse> {
    return this.execute("getCodeFixes", args)
  }
  public executeGetSupportedCodeFixes(): Promise<protocol.GetSupportedCodeFixesResponse> {
    return this.execute("getSupportedCodeFixes", undefined)
  }
  public executeGetErr(args: protocol.GeterrRequestArgs): Promise<undefined> {
    return this.execute("geterr", args)
  }
  public executeGetErrForProject(args: protocol.GeterrForProjectRequestArgs): Promise<undefined> {
    return this.execute("geterrForProject", args)
  }
  public executeOccurences(
    args: protocol.FileLocationRequestArgs,
  ): Promise<protocol.OccurrencesResponse> {
    return this.execute("occurrences", args)
  }
  public executeOpen(args: protocol.OpenRequestArgs): Promise<undefined> {
    return this.execute("open", args)
  }
  public executeProjectInfo(
    args: protocol.ProjectInfoRequestArgs,
  ): Promise<protocol.ProjectInfoResponse> {
    return this.execute("projectInfo", args)
  }
  public executeQuickInfo(
    args: protocol.FileLocationRequestArgs,
  ): Promise<protocol.QuickInfoResponse> {
    return this.execute("quickinfo", args)
  }
  public executeReferences(
    args: protocol.FileLocationRequestArgs,
  ): Promise<protocol.ReferencesResponse> {
    return this.execute("references", args)
  }
  public executeReload(args: protocol.ReloadRequestArgs): Promise<protocol.ReloadResponse> {
    return this.execute("reload", args)
  }
  public executeRename(args: protocol.RenameRequestArgs): Promise<protocol.RenameResponse> {
    return this.execute("rename", args)
  }
  public executeSaveTo(args: protocol.SavetoRequestArgs) {
    return this.execute("saveto", args)
  }
  public executeNavTree(args: protocol.FileRequestArgs): Promise<protocol.NavTreeResponse> {
    return this.execute("navtree", args)
  }
  public executeNavto(args: protocol.NavtoRequestArgs): Promise<protocol.NavtoResponse> {
    return this.execute("navto", args)
  }

  public startServer() {
    if (!this.serverPromise) {
      let lastStderrOutput: string
      let reject: (err: Error) => void

      const exitHandler = (result: Error | number) => {
        const err = typeof result === "number" ? new Error("exited with code: " + result) : result

        console.error("tsserver: ", err)
        this.callbacks.rejectAll(err)
        reject(err)
        this.serverPromise = undefined

        setImmediate(() => {
          let detail = (err && err.stack) || ""

          if (lastStderrOutput) {
            detail = "Last output from tsserver:\n" + lastStderrOutput + "\n \n" + detail
          }

          atom.notifications.addError("Typescript quit unexpectedly", {
            detail,
            dismissable: true,
          })
        })
      }

      return (this.serverPromise = new Promise<ChildProcess>((resolve, pReject) => {
        reject = pReject

        if (window.atom_typescript_debug) {
          console.log("starting", this.tsServerPath)
        }

        const cp = startServer(this.tsServerPath)

        cp.once("error", exitHandler)
        cp.once("exit", exitHandler)

        // Pipe both stdout and stderr appropriately
        messageStream(cp.stdout).on("data", this.onMessage)
        cp.stderr.on("data", data => {
          console.warn("tsserver stderr:", (lastStderrOutput = data.toString()))
        })

        // We send an unknown command to verify that the server is working.
        this.sendRequest(cp, "ping", null, true).then(() => resolve(cp), () => resolve(cp))
      }))
    } else {
      throw new Error(`Server already started: ${this.tsServerPath}`)
    }
  }

  /** Adds an event listener for tsserver or other events. Returns an unsubscribe function */
  public on(
    name: "configFileDiag" | "semanticDiag" | "syntaxDiag",
    listener: (result: protocol.DiagnosticEventBody) => any,
  ): () => void
  public on(name: "pendingRequestsChange", listener: (requests: string[]) => any): () => void
  public on(name: string, listener: (result: any) => any): () => void {
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
    } else if (isEvent(res)) {
      if (window.atom_typescript_debug) {
        console.log("received event", res)
      }

      this.events.emit(res.event, res.body)
    }
  }

  private async execute(command: "change", args: protocol.ChangeRequestArgs): Promise<undefined>
  private async execute(command: "close", args: protocol.FileRequestArgs): Promise<undefined>
  private async execute(
    command: "compileOnSaveAffectedFileList",
    args: protocol.FileRequestArgs,
  ): Promise<protocol.CompileOnSaveAffectedFileListResponse>
  private async execute(
    command: "compileOnSaveEmitFile",
    args: protocol.CompileOnSaveEmitFileRequestArgs,
  ): Promise<protocol.Response & {body: boolean}>
  private async execute(
    command: "completions",
    args: protocol.CompletionsRequestArgs,
  ): Promise<protocol.CompletionsResponse>
  private async execute(
    command: "completionEntryDetails",
    args: protocol.CompletionDetailsRequestArgs,
  ): Promise<protocol.CompletionDetailsResponse>
  private async execute(
    command: "configure",
    args: protocol.ConfigureRequestArguments,
  ): Promise<undefined>
  private async execute(
    command: "definition",
    args: protocol.FileLocationRequestArgs,
  ): Promise<protocol.DefinitionResponse>
  private async execute(
    command: "format",
    args: protocol.FormatRequestArgs,
  ): Promise<protocol.FormatResponse>
  private async execute(
    command: "getCodeFixes",
    args: protocol.CodeFixRequestArgs,
  ): Promise<protocol.GetCodeFixesResponse>
  private async execute(
    command: "getSupportedCodeFixes",
    args: undefined,
  ): Promise<protocol.GetSupportedCodeFixesResponse>
  private async execute(command: "geterr", args: protocol.GeterrRequestArgs): Promise<undefined>
  private async execute(
    command: "geterrForProject",
    args: protocol.GeterrForProjectRequestArgs,
  ): Promise<undefined>
  private async execute(
    command: "occurrences",
    args: protocol.FileLocationRequestArgs,
  ): Promise<protocol.OccurrencesResponse>
  private async execute(command: "open", args: protocol.OpenRequestArgs): Promise<undefined>
  private async execute(
    command: "projectInfo",
    args: protocol.ProjectInfoRequestArgs,
  ): Promise<protocol.ProjectInfoResponse>
  private async execute(
    command: "quickinfo",
    args: protocol.FileLocationRequestArgs,
  ): Promise<protocol.QuickInfoResponse>
  private async execute(
    command: "references",
    args: protocol.FileLocationRequestArgs,
  ): Promise<protocol.ReferencesResponse>
  private async execute(
    command: "reload",
    args: protocol.ReloadRequestArgs,
  ): Promise<protocol.ReloadResponse>
  private async execute(
    command: "rename",
    args: protocol.RenameRequestArgs,
  ): Promise<protocol.RenameResponse>
  private async execute(command: "saveto", args: protocol.SavetoRequestArgs): Promise<undefined>
  private async execute(
    command: "navtree",
    args: protocol.FileRequestArgs,
  ): Promise<protocol.NavTreeResponse>
  private async execute(
    command: "navto",
    args: protocol.NavtoRequestArgs,
  ): Promise<protocol.NavtoResponse>
  private async execute(command: string, args: any) {
    if (!this.serverPromise) {
      throw new Error("Server is not running")
    }

    return this.sendRequest(
      await this.serverPromise,
      command,
      args,
      commandWithResponse.has(command),
    )
  }

  private sendRequest(
    cp: ChildProcess,
    command: string,
    args: any,
    expectResponse: true,
  ): Promise<protocol.Response>
  private sendRequest(
    cp: ChildProcess,
    command: string,
    args: any,
    expectResponse: false,
  ): undefined
  private sendRequest(
    cp: ChildProcess,
    command: string,
    args: any,
    expectResponse: boolean,
  ): Promise<protocol.Response> | undefined
  private sendRequest(
    cp: ChildProcess,
    command: string,
    args: any,
    expectResponse: boolean,
  ): Promise<protocol.Response> | undefined {
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
}

function startServer(tsServerPath: string): ChildProcess {
  const locale = atom.config.get("atom-typescript.locale")
  const tsServerArgs: string[] = locale ? ["--locale", locale] : []
  if (INSPECT_TSSERVER) {
    return new BufferedProcess({
      command: "node",
      args: ["--inspect", tsServerPath].concat(tsServerArgs),
    }).process as any
  } else {
    return new BufferedNodeProcess({
      command: tsServerPath,
      args: tsServerArgs,
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
