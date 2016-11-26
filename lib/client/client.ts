import {ChildProcess, spawn} from "child_process"
import {EventEmitter} from "events"
import {Transform, Readable} from "stream"
import * as fs from "fs"
import * as path from "path"
import * as resolve from "resolve"
import byline = require("byline")

export class TypescriptServiceClient {

  /** Map of callbacks that are waiting for responses */
  callbacks: {
    [seq: number]: {
      reject(res)
      resolve(res)
      started: number
    }
  } = {}

  private listeners: {
    [event: string]: ((event: any) => any)[]
  } = {}

  /** Path to the tsserver executable */
  readonly tsServerPath: string

  /** The tsserver child process */
  server: ChildProcess

  /** Promise that resolves when the server is ready to accept requests */
  serverPromise: Promise<any>

  private seq = 0

  constructor(tsServerPath: string) {
    this.tsServerPath = tsServerPath
    this.serverPromise = this.startServer()
  }

  static commandWithResponse = {
    completions: true,
    projectInfo: true,
    quickInfo: true
  }

  executeChange(args: protocol.ChangeRequestArgs) {
    this.execute("change", args)
  }
  executeClose(args: protocol.FileRequestArgs) {
    this.execute("close", args)
  }
  executeCompletions(args: protocol.CompletionsRequestArgs): Promise<protocol.CompletionsResponse> {
    return this.execute("completions", args)
  }
  executeGetErr(args: protocol.GeterrRequestArgs) {
    this.execute("geterr", args)
  }
  executeOpen(args: protocol.OpenRequestArgs) {
    this.execute("open", args)
  }
  executeProjectInfo(args: protocol.ProjectInfoRequestArgs): Promise<protocol.ProjectInfoResponse> {
    return this.execute("projectInfo", args)
  }
  executeQuickInfo(args: protocol.FileLocationRequestArgs): Promise<protocol.QuickInfoResponse> {
    return this.execute("quickInfo", args)
  }

  execute(command: string, args): Promise<any> {
    return this.serverPromise.then(cp => {
      const expectResponse = !!TypescriptServiceClient.commandWithResponse[command]
      return this.sendRequest(cp, command, args, expectResponse)
    }).catch(err => {
      console.log("command", command, "failed due to", err)
      throw err
    })
  }

  /** Adds an event listener for tsserver events. Returns an unsubscribe function */
  on(name: "syntaxDiag", listener: (result: protocol.DiagnosticEventBody) => any): Function
  on(name: "semanticDiag", listener: (result: protocol.DiagnosticEventBody) => any): Function
  on(name: string, listener: (result: any) => any): Function {
    if (this.listeners[name] === undefined) {
      this.listeners[name] = []
    }

    this.listeners[name].push(listener)

    return () => {
      const idx = this.listeners[name].indexOf(listener)
      this.listeners[name].splice(idx, 1)
    }
  }

  private onMessage = (res: protocol.Response | protocol.Event) => {
    if (isResponse(res)) {
      const callback = this.callbacks[res.request_seq]
      if (callback) {
        console.log("received response for", res.command, "in", Date.now() - callback.started, "ms", "with data", res.body)
        delete this.callbacks[res.request_seq]
        if (res.success) {
          callback.resolve(res)
        } else {
          callback.reject(new Error(res.message))
        }
      }
    } else if (isEvent(res)) {
      console.log("received event", res)
      const listeners = this.listeners[res.event]
      if (listeners) {
        for (const listener of listeners) {
          listener(res.body)
        }
      }
    }
  }

  private sendRequest(cp: ChildProcess, command: string, args, expectResponse: boolean): Promise<protocol.Response> | undefined {

    const req = {
      seq: this.seq++,
      command,
      arguments: args
    }

    console.log("sending request", command, "with args", args)

    let resultPromise: Promise<protocol.Response> | undefined = undefined

    if (expectResponse) {
      resultPromise = new Promise((resolve, reject) => {
        this.callbacks[req.seq] = {resolve, reject, started: Date.now()}
      })
    }

    cp.stdin.write(JSON.stringify(req) + "\n")

    return resultPromise
  }

  private startServer(): Promise<ChildProcess> {
    return new Promise<ChildProcess>((resolve, reject) => {
      console.log("starting", this.tsServerPath)

      const cp = spawn(this.tsServerPath, [])

      cp.once("error", err => {
        console.log("tsserver starting failed with", err)
        reject(err)
      })

      cp.once("exit", code => {
        console.log("tsserver failed to start with code", code)
        reject({code})
      })

      messageStream(cp.stdout).on("data", this.onMessage)

      // We send an unknown command to verify that the server is working.
      this.sendRequest(cp, "ping", null, true).then(res => resolve(cp), err => resolve(cp))
    })
  }
}

function isEvent(res: protocol.Response | protocol.Event): res is protocol.Event {
  return res.type === "event"
}

function isResponse(res: protocol.Response | protocol.Event): res is protocol.Response {
  return res.type === "response"
}

/** Given a start directory, try to resolve tsserver executable from node_modules */
export function findTSServer(basedir: string): string {
  const tsPath = resolve.sync("typescript/package.json", {basedir})
  const tsServerPath = path.resolve(path.dirname(tsPath), "bin", "tsserver")

  // This will throw if the file does not exist on the disk
  fs.statSync(tsServerPath)

  return tsServerPath
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

  _transform(line, encoding, callback) {
    if (this.lineCount % 2 === 0) {
      this.push(JSON.parse(line))
    }

    this.lineCount += 1

    callback(null)
  }
}
