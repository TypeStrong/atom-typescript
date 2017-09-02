// A class to keep all changes to the buffer in sync with tsserver. This is mainly used with
// the editor panes, but is also useful for editor-less buffer changes (renameRefactor).
import {CompositeDisposable, Disposable} from "atom"
import {TypescriptServiceClient as Client} from "../client/client"
import {EventEmitter} from "events"
import {isTypescriptFile} from "./atom/utils"

export class TypescriptBuffer {
  // Timestamps for buffer events
  changedAt: number = 0
  changedAtBatch: number = 0

  // Promise that resolves to the correct client for this filePath
  private clientPromise?: Promise<Client>

  // Flag that signifies if tsserver has an open view of this file
  isOpen: boolean

  private events = new EventEmitter()
  private subscriptions = new CompositeDisposable()
  private filePath: string

  constructor(
    public buffer: TextBuffer.ITextBuffer,
    public getClient: (filePath: string) => Promise<Client>,
  ) {
    this.subscriptions.add(buffer.onDidChange(this.onDidChange))
    this.subscriptions.add(buffer.onDidChangePath(this.onDidChangePath))
    this.subscriptions.add(buffer.onDidDestroy(this.dispose))
    this.subscriptions.add(buffer.onDidSave(this.onDidSave))
    this.subscriptions.add(buffer.onDidStopChanging(this.onDidStopChanging))

    this.open()
  }

  async open() {
    this.filePath = this.buffer.getPath()

    if (isTypescriptFile(this.filePath)) {
      // Set isOpen before we actually open the file to enqueue any changed events
      this.isOpen = true

      this.clientPromise = this.getClient(this.filePath)
      const client = await this.clientPromise

      await client.executeOpen({
        file: this.filePath,
        fileContent: this.buffer.getText(),
      })

      this.events.emit("opened")
    }
  }

  // If there are any pending changes, flush them out to the Typescript server
  async flush() {
    if (this.changedAt > this.changedAtBatch) {
      let sub: Disposable | undefined
      await new Promise(resolve => {
        sub = this.buffer.onDidStopChanging(() => {
          resolve()
        })

        this.buffer.emitDidStopChangingEvent()
      })

      if (sub) {
        sub.dispose()
      }
    }
  }

  dispose = async () => {
    this.subscriptions.dispose()

    if (this.isOpen && this.clientPromise) {
      const client = await this.clientPromise
      client.executeClose({file: this.buffer.getPath()})
      this.events.emit("closed", this.filePath)
    }
  }

  on(name: "saved", callback: () => void): this // saved after waiting for any pending changes
  on(name: "opened", callback: () => void): this // the file is opened
  on(name: "closed", callback: (filePath: string) => void): this // the file is closed
  on(name: "changed", callback: () => void): this // tsserver view of the file has changed
  on(name: string, callback: (() => void) | ((filePath: string) => void)): this {
    this.events.on(name, callback)
    return this
  }

  onDidChange = () => {
    this.changedAt = Date.now()
  }

  onDidChangePath = async (newPath: string) => {
    if (this.clientPromise && this.filePath) {
      const client = await this.clientPromise
      client.executeClose({file: this.filePath})
      this.events.emit("closed", this.filePath)
    }

    this.open()
  }

  onDidSave = async () => {
    // Check if there isn't a onDidStopChanging event pending.
    const {changedAt, changedAtBatch} = this
    if (changedAt && changedAtBatch && changedAt > changedAtBatch) {
      await new Promise(resolve => this.events.once("changed", resolve))
    }

    this.events.emit("saved")
  }

  onDidStopChanging = async ({changes}: {changes: any[]}) => {
    // Don't update changedAt or emit any events if there are no actual changes or file isn't open
    if (changes.length === 0 || !this.isOpen || !this.clientPromise) {
      return
    }

    this.changedAtBatch = Date.now()

    const client = await this.clientPromise
    const filePath = this.buffer.getPath()

    for (const change of changes) {
      const {start, oldExtent, newText} = change

      const end = {
        endLine: start.row + oldExtent.row + 1,
        endOffset: (oldExtent.row === 0 ? start.column + oldExtent.column : oldExtent.column) + 1,
      }

      await client.executeChange({
        ...end,
        file: filePath,
        line: start.row + 1,
        offset: start.column + 1,
        insertString: newText,
      })
    }

    this.events.emit("changed")
  }
}
