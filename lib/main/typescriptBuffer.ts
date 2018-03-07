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
  private state?: {
    client: Promise<Client>
    filePath: string
  }

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
    return this.state && this.state.filePath
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
    if (!this.state) return
    const client = await this.state.client
    try {
      const navtreeResult = await client.execute("navtree", {file: this.state.filePath})
      return navtreeResult.body!
    } catch (err) {
      console.error(err, this.state.filePath)
    }
    return
  }

  public async getNavTo(search: string) {
    if (!this.state) return
    const client = await this.state.client
    try {
      const navtoResult = await client.execute("navto", {
        file: this.state.filePath,
        currentFileOnly: false,
        searchValue: search,
        maxResultCount: 1000,
      })
      return navtoResult.body!
    } catch (err) {
      console.error(err, this.state.filePath)
    }
    return
  }

  private async open() {
    const filePath = this.buffer.getPath()

    if (filePath !== undefined && isTypescriptFile(filePath)) {
      this.state = {
        client: this.getClient(filePath),
        filePath,
      }
      const client = await this.state.client

      await client.execute("open", {
        file: this.state.filePath,
        fileContent: this.buffer.getText(),
      })

      this.events.emit("opened")
    } else {
      this.state = undefined
    }
  }

  private dispose = async () => {
    this.subscriptions.dispose()
    await this.close()
  }

  private close = async () => {
    if (this.state) {
      const client = await this.state.client
      const file = this.state.filePath
      await client.execute("close", {file})
      this.events.emit("closed", file)
      this.state = undefined
    }
  }

  private onDidChange = () => {
    this.changedAt = Date.now()
  }

  private onDidChangePath = async () => {
    await this.close()
    await this.open()
  }

  private onDidSave = async () => {
    // Check if there isn't a onDidStopChanging event pending.
    const {changedAt, changedAtBatch} = this
    if (changedAtBatch > 0 && changedAt > changedAtBatch) {
      await new Promise<void>(resolve => this.events.once("changed", resolve))
    }

    this.events.emit("saved")
  }

  private onDidStopChanging = async ({changes}: {changes: Atom.TextChange[]}) => {
    // Don't update changedAt or emit any events if there are no actual changes or file isn't open
    if (changes.length === 0 || !this.state) return

    this.changedAtBatch = Date.now()

    const client = await this.state.client

    for (const change of changes) {
      const {start, oldExtent, newText} = change

      const end = {
        endLine: start.row + oldExtent.row + 1,
        endOffset: (oldExtent.row === 0 ? start.column + oldExtent.column : oldExtent.column) + 1,
      }

      await client.execute("change", {
        ...end,
        file: this.state.filePath,
        line: start.row + 1,
        offset: start.column + 1,
        insertString: newText,
      })
    }

    this.events.emit("changed")
  }
}
