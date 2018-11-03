import {ReportBusyWhile} from "../main/pluginManager"
import {CommandRes, CommandsWithResponse} from "./commandArgsResponseMap"

interface Request {
  started: number
  reject(err: Error): void
  resolve(res: any): void
}

// Callbacks keeps track of all the outstanding requests
export class Callbacks {
  private callbacks: Map<number, Request> = new Map()

  constructor(private reportBusyWhile: ReportBusyWhile) {}

  public async add<T extends CommandsWithResponse>(
    seq: number,
    command: T,
  ): Promise<CommandRes<T>> {
    try {
      const promise = new Promise<CommandRes<T>>((resolve, reject) => {
        this.callbacks.set(seq, {
          resolve,
          reject,
          started: Date.now(),
        })
      })
      return await this.reportBusyWhile(command, () => promise)
    } finally {
      this.callbacks.delete(seq)
    }
  }

  public rejectAll(error: Error) {
    for (const {reject} of this.callbacks.values()) {
      reject(error)
    }

    this.callbacks.clear()
  }

  public resolve<T extends CommandsWithResponse>(seq: number, res: CommandRes<T>): void {
    const req = this.callbacks.get(seq)
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

  public error(seq: number, err: Error): void {
    const req = this.callbacks.get(seq)
    if (req) req.reject(err)
    else console.error(err)
  }
}
