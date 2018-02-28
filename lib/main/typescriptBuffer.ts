// A class to keep all changes to the buffer in sync with tsserver. This is mainly used with
// the editor panes, but is also useful for editor-less buffer changes (renameRefactor).
import * as Atom from "atom"
import {TypescriptServiceClient as Client} from "../client/client"
import {isTypescriptFile} from "./atom/utils"

export class TypescriptBuffer {
  public static create(buffer: Atom.TextBuffer, getClient: (filePath: string) => Promise<Client>) {
    const b = TypescriptBuffer.bufferMap.get(buffer)
    if (b) return b
    else {
      const nb = new TypescriptBuffer(buffer, getClient)
      TypescriptBuffer.bufferMap.set(buffer, nb)
      return nb
    }
  }
  private static bufferMap = new WeakMap<Atom.TextBuffer, TypescriptBuffer>()

  public readonly events = new Atom.Emitter<
    {
      saved: void
      opened: void
      changed: void
    },
    {
      closed: string
    }
  >()

  // Timestamps for buffer events
  private changedAt: number = 0
  private changedAtBatch: number = 0

  // Promise that resolves to the correct client for this filePath
  private clientPromise?: Promise<Client>

  // Flag that signifies if tsserver has an open view of this file
  private isOpen: boolean
  private subscriptions = new Atom.CompositeDisposable()

  private constructor(
    public buffer: Atom.TextBuffer,
    public getClient: (filePath: string) => Promise<Client>,
  ) {
    this.subscriptions.add(
      buffer.onDidChange(this.onDidChange),
      buffer.onDidChangePath(this.onDidChangePath),
      buffer.onDidDestroy(this.dispose),
      buffer.onDidSave(this.onDidSave),
      buffer.onDidStopChanging(this.onDidStopChanging),
    )

    this.open()
  }

  public getPath() {
    return this.buffer.getPath()
  }

  // If there are any pending changes, flush them out to the Typescript server
  public async flush() {
    if (this.changedAt > this.changedAtBatch) {
      await new Promise(resolve => {
        const sub = this.buffer.onDidStopChanging(() => {
          sub.dispose()
          resolve()
        })
        this.buffer.emitDidStopChangingEvent()
      })
    }
  }

  public async getNavTree() {
    const filePath = this.buffer.getPath()
    if (!filePath) return
    const client = await this.clientPromise
    if (!client) return
    try {
      const navtreeResult = await client.executeNavTree({file: filePath})
      return navtreeResult.body!
    } catch (err) {
      console.error(err, filePath)
    }
    return
  }

  private async open() {
    const filePath = this.buffer.getPath()

    if (filePath && isTypescriptFile(filePath)) {
      // Set isOpen before we actually open the file to enqueue any changed events
      this.isOpen = true

      this.clientPromise = this.getClient(filePath)
      const client = await this.clientPromise

      await client.executeOpen({
        file: filePath,
        fileContent: this.buffer.getText(),
      })

      this.events.emit("opened")
    }
  }

  private dispose = async () => {
    this.subscriptions.dispose()

    if (this.isOpen && this.clientPromise) {
      const client = await this.clientPromise
      const file = this.buffer.getPath()
      if (file) {
        client.executeClose({file})
        this.events.emit("closed", file)
      }
    }
  }

  private onDidChange = () => {
    this.changedAt = Date.now()
  }

  private onDidChangePath = async () => {
    const filePath = this.buffer.getPath()
    if (this.clientPromise && filePath) {
      const client = await this.clientPromise
      client.executeClose({file: filePath})
      this.events.emit("closed", filePath)
    }

    this.open()
  }

  private onDidSave = async () => {
    // Check if there isn't a onDidStopChanging event pending.
    const {changedAt, changedAtBatch} = this
    if (changedAt && changedAtBatch && changedAt > changedAtBatch) {
      await new Promise<void>(resolve => this.events.once("changed", resolve))
    }

    this.events.emit("saved")
  }

  private onDidStopChanging = async ({changes}: {changes: Atom.TextChange[]}) => {
    // Don't update changedAt or emit any events if there are no actual changes or file isn't open
    if (changes.length === 0 || !this.isOpen || !this.clientPromise) {
      return
    }

    this.changedAtBatch = Date.now()

    const filePath = this.buffer.getPath()
    if (!filePath) {
      return
    }
    const client = await this.clientPromise

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
