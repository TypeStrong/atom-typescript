import * as protocol from "typescript/lib/protocol"

interface Request {
  name: string
  reject(err: Error): void
  resolve(res: protocol.Response): void
  started: number
}

// Callbacks keeps track of all the outstanding requests
export class Callbacks {
  private callbacks: Map<number, Request> = new Map()

  constructor(private onPendingChange: (pending: string[]) => void) {}

  add(seq: number, command: string) {
    return new Promise((resolve, reject) => {
      this.callbacks.set(seq, {
        name: command,
        resolve,
        reject,
        started: Date.now()
      })

      this.onPendingChange(this.pending())
    })
  }

  // pending returns names of requests waiting for a response
  pending(): string[] {
    const pending: string[] = []

    for (const {name} of this.callbacks.values()) {
      pending.push(name)
    }

    return pending
  }

  rejectAll(error: any) {
    for (const {reject} of this.callbacks.values()) {
      reject(error)
    }

    this.callbacks.clear()
    this.onPendingChange(this.pending())
  }

  // Remove and return a Request object, if one exists
  remove(seq: number): Request | undefined {
    const req = this.callbacks.get(seq)
    this.callbacks.delete(seq)
    if (req) {
      this.onPendingChange(this.pending())
    }
    return req
  }
}
