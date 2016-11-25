import {ChildProcess, spawn} from "child_process"
import {EventEmitter} from "events"
import {Transform, Readable} from "stream"
import * as fs from "fs"
import * as path from "path"
import * as protocol from "typescript/lib/protocol"
import * as resolve from "resolve"
import byline = require("byline")

export class TypescriptServiceClient extends EventEmitter {

  /** Map of callbacks that are waiting for responses */
  callbacks: {
    [seq: number]: {
      reject(res)
      resolve(res)
      started: number
    }
  } = {}

  /** Path to the tsserver executable */
  readonly tsServerPath: string

  /** The tsserver child process */
  server: ChildProcess

  /** Promise that resolves when the server is ready to accept requests */
  serverPromise: Promise<any>

  private seq = 0

  constructor(tsServerPath: string) {
    super()
    this.tsServerPath = tsServerPath
    this.serverPromise = this.startServer()
  }

  execute(command: protocol.CommandTypes.Completions, args: protocol.CompletionsRequestArgs, expectResponse: boolean): Promise<protocol.CompletionsResponse>
  execute(command: protocol.CommandTypes.Open, args: protocol.OpenRequestArgs): void
  execute(command: protocol.CommandTypes.Quickinfo, args: protocol.FileLocationRequestArgs, expectResponse: boolean): Promise<protocol.QuickInfoResponse>
  execute(command: string, args, expectResponse?: boolean): Promise<any> {
    return this.serverPromise.then(cp => {
      return this.sendRequest(cp, command, args, expectResponse)
    }).catch(err => {
      console.log("command", command, "failed due to", err)
      throw err
    })
  }

  private onMessage = (res: protocol.Response | protocol.Event) => {
    if (isResponse(res)) {
      const callback = this.callbacks[res.request_seq]
      if (callback) {
        console.log("received response in", Date.now() - callback.started, "ms")
        delete this.callbacks[res.request_seq]
        if (res.success) {
          callback.resolve(res)
        } else {
          callback.reject(new Error(res.message))
        }
      }
    } else if (isEvent(res)) {
      console.log("received event", res)
      this.emit(res.event, res.body)
    }
  }

  private sendRequest(cp: ChildProcess, command: string, args, expectResponse: boolean): Promise<protocol.Response> | undefined {

    const req = {
      seq: this.seq++,
      command,
      arguments: args
    }

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
  const tsPath = resolve.sync("typescript", {basedir})
  const tsServerPath = path.resolve(path.dirname(tsPath), "..", "bin", "tsserver")

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
