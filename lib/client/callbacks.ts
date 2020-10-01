import proto from "typescript/lib/protocol"
import {ReportBusyWhile} from "../main/pluginManager"
import {CommandRes, CommandsWithCallback, CommandsWithResponse} from "./commandArgsResponseMap"

interface Request {
  command: CommandsWithCallback
  started: number
  reject(err: Error): void
  resolve(res: any): void
}

// Callbacks keeps track of all the outstanding requests
export class Callbacks {
  private callbacks: Map<number, Request> = new Map()
  private interval: number = 0

  constructor(private reportBusyWhile: ReportBusyWhile) {}

  public async add<T extends CommandsWithCallback>(
    seq: number,
    command: T,
  ): Promise<CommandRes<T>> {
    try {
      const promise = new Promise<CommandRes<T>>((resolve, reject) => {
        this.callbacks.set(seq, {
          command,
          resolve,
          reject,
          started: Date.now(),
        })
      })
      if (this.interval === 0) {
        this.interval = window.setInterval(() => {
          process.activateUvLoop()
        }, 100)
      }
      return await this.reportBusyWhile(command, () => promise)
    } finally {
      this.callbacks.delete(seq)
      if (this.interval !== 0 && this.callbacks.size === 0) {
        clearInterval(this.interval)
        this.interval = 0
      }
    }
  }

  public rejectAll(error: Error) {
    for (const {reject} of this.callbacks.values()) {
      reject(error)
    }

    this.callbacks.clear()
  }

  public resolve<T extends CommandsWithResponse>(res: CommandRes<T>): void {
    const req = this.callbacks.get(res.request_seq)
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
      if (res.success) req.resolve(res)
      else req.reject(new Error(res.message))
    } else console.warn("unexpected response:", res)
  }

  public resolveMS(body: proto.RequestCompletedEventBody): void {
    const req = this.callbacks.get(body.request_seq)
    if (req) {
      if (window.atom_typescript_debug) {
        console.log(
          `received requestCompleted event for multistep command ${req.command} in ${
            Date.now() - req.started
          } ms`,
        )
      }
      req.resolve(undefined)
    } else console.warn(`unexpected requestCompleted event:`, body)
  }

  public error(seq: number, err: Error): void {
    const req = this.callbacks.get(seq)
    if (req) req.reject(err)
    else console.error(err)
  }
}
