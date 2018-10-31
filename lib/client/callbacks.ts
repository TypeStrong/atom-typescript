import * as protocol from "typescript/lib/protocol"
import {ReportBusyWhile} from "../main/pluginManager"

interface Request {
  name: string
  started: number
  reject(err: Error): void
  resolve(res: protocol.Response): void
}

// Callbacks keeps track of all the outstanding requests
export class Callbacks {
  private callbacks: Map<number, Request> = new Map()

  constructor(private reportBusyWhile: ReportBusyWhile) {}

  public async add(seq: number, command: string) {
    try {
      return await this.reportBusyWhile(
        command,
        () =>
          new Promise<protocol.Response>((resolve, reject) => {
            this.callbacks.set(seq, {
              name: command,
              resolve,
              reject,
              started: Date.now(),
            })
          }),
      )
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

  public resolve(seq: number, res: protocol.Response): void {
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
