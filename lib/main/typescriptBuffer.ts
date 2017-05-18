// A class to keep all changes to the buffer in sync with tsserver. This is mainly used with
// the editor panes, but is also useful for editor-less buffer changes (renameRefactor).
import {CompositeDisposable} from "atom"
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

  constructor(
    public buffer: TextBuffer.ITextBuffer,
    public getClient: (filePath: string) => Promise<Client>
  ) {
    this.subscriptions.add(buffer.onDidChange(this.onDidChange))
    this.subscriptions.add(buffer.onDidChangePath(this.onDidSave))
    this.subscriptions.add(buffer.onDidDestroy(this.dispose))
    this.subscriptions.add(buffer.onDidSave(this.onDidSave))
    this.subscriptions.add(buffer.onDidStopChanging(this.onDidStopChanging))

    this.open()
  }

  async open() {
    const filePath = this.buffer.getPath()

    if (isTypescriptFile(filePath)) {
      // Set isOpen before we actually open the file to enqueue any changed events
      this.isOpen = true

      this.clientPromise = this.getClient(filePath)
      const client = await this.clientPromise

      await client.executeOpen({
        file: filePath,
        fileContent: this.buffer.getText()
      })

      this.events.emit("opened")
    }
  }

  // If there are any pending changes, flush them out to the Typescript server
  async flush() {
    if (this.changedAt > this.changedAtBatch) {
      const prevDelay = this.buffer.stoppedChangingDelay
      try {
        this.buffer.stoppedChangingDelay = 0
        this.buffer.scheduleDidStopChangingEvent()
        await new Promise(resolve => {
          const {dispose} = this.buffer.onDidStopChanging(() => {
            dispose()
            resolve()
          })
        })
      } finally {
        this.buffer.stoppedChangingDelay = prevDelay
      }
    }
  }

  dispose = () => {
    this.subscriptions.dispose()

    if (this.isOpen && this.clientPromise) {
      this.clientPromise.then(client =>
        client.executeClose({file: this.buffer.getPath()}))
    }
  }

  on(name: "saved", callback: () => any): this // saved after waiting for any pending changes
  on(name: "opened", callback: () => any): this // the file is opened
  on(name: "changed", callback: () => any): this // tsserver view of the file has changed
  on(name: string, callback: () => any): this {
    this.events.on(name, callback)
    return this
  }

  onDidChange = () => {
    this.changedAt = Date.now()
  }

  onDidSave = async () => {
    // Check if there isn't a onDidStopChanging event pending.
    const {changedAt, changedAtBatch} = this
    if (changedAt && changedAt > changedAtBatch) {
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
        endOffset: (oldExtent.row === 0 ? start.column + oldExtent.column: oldExtent.column) + 1
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
