import * as protocol from "typescript/lib/protocol"

interface Request {
  name: string
  started: number
  reject(err: Error): void
  resolve(res: protocol.Response): void
}

// Callbacks keeps track of all the outstanding requests
export class Callbacks {
  private callbacks: Map<number, Request> = new Map()

  constructor(private onPendingChange: (pending: string[]) => void) {}

  public add(seq: number, command: string) {
    return new Promise<protocol.Response>((resolve, reject) => {
      this.callbacks.set(seq, {
        name: command,
        resolve,
        reject,
        started: Date.now(),
      })

      this.onPendingChange(this.pending())
    })
  }

  public rejectAll(error: Error) {
    for (const {reject} of this.callbacks.values()) {
      reject(error)
    }

    this.callbacks.clear()
    this.onPendingChange(this.pending())
  }

  // Remove and return a Request object, if one exists
  public remove(seq: number): Request | undefined {
    const req = this.callbacks.get(seq)
    this.callbacks.delete(seq)
    if (req) {
      this.onPendingChange(this.pending())
    }
    return req
  }

  // pending returns names of requests waiting for a response
  private pending(): string[] {
    const pending: string[] = []

    for (const {name} of this.callbacks.values()) {
      pending.push(name)
    }

    return pending
  }
}
