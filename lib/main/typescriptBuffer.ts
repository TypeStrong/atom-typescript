// A class to keep all changes to the buffer in sync with tsserver. This is mainly used with
// the editor panes, but is also useful for editor-less buffer changes (renameRefactor).
import * as Atom from "atom"
import {flatten} from "lodash"
import {GetClientFunction, TSClient} from "../client"
import {handlePromise} from "../utils"
import {getOpenEditorsPaths, getProjectCodeSettings, isTypescriptFile} from "./atom/utils"

export interface Deps {
  getClient: GetClientFunction
  clearFileErrors: (filePath: string) => void
}

export class TypescriptBuffer {
  public static create(buffer: Atom.TextBuffer, deps: Deps) {
    const b = TypescriptBuffer.bufferMap.get(buffer)
    if (b) return b
    else {
      const nb = new TypescriptBuffer(buffer, deps)
      TypescriptBuffer.bufferMap.set(buffer, nb)
      return nb
    }
  }
  private static bufferMap = new WeakMap<Atom.TextBuffer, TypescriptBuffer>()

  private events = new Atom.Emitter<{
    saved: void
    opened: void
    changed: void
  }>()

  // Timestamps for buffer events
  private changedAt: number = 0
  private changedAtBatch: number = 0

  // Promise that resolves to the correct client for this filePath
  private state?: {
    client: TSClient
    filePath: string
    // Path to the project's tsconfig.json
    configFile: string | undefined
  }

  private subscriptions = new Atom.CompositeDisposable()

  // tslint:disable-next-line:member-ordering
  public on = this.events.on.bind(this.events)

  private constructor(public buffer: Atom.TextBuffer, private deps: Deps) {
    this.subscriptions.add(
      buffer.onDidChange(this.onDidChange),
      buffer.onDidChangePath(this.onDidChangePath),
      buffer.onDidDestroy(this.dispose),
      buffer.onDidSave(this.onDidSave),
      buffer.onDidStopChanging(this.onDidStopChanging),
    )

    handlePromise(this.open())
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
    const client = this.state.client
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
    const client = this.state.client
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

  public getInfo() {
    if (!this.state) return
    return {
      clientVersion: this.state.client.version,
      tsConfigPath: this.state.configFile,
    }
  }

  public async getErr() {
    if (!this.state) return
    await this.state.client.execute("geterr", {
      files: [this.state.filePath],
      delay: 100,
    })
  }

  /** Throws! */
  public async compile() {
    if (!this.state) return
    const {client, filePath} = this.state
    const result = await client.execute("compileOnSaveAffectedFileList", {
      file: filePath,
    })
    const fileNames = flatten(result.body.map(project => project.fileNames))

    if (fileNames.length === 0) return

    const promises = fileNames.map(file => client.execute("compileOnSaveEmitFile", {file}))
    const saved = await Promise.all(promises)

    if (!saved.every(res => !!res.body)) {
      throw new Error("Some files failed to emit")
    }
  }

  private async open() {
    const filePath = this.buffer.getPath()

    if (filePath !== undefined && isTypescriptFile(filePath)) {
      const client = await this.deps.getClient(filePath)

      this.state = {
        client,
        filePath,
        configFile: undefined,
      }

      client.on("restarted", () => handlePromise(this.init()))

      await this.init()

      const result = await client.execute("projectInfo", {
        needFileNameList: false,
        file: filePath,
      })

      // TODO: wrong type here, complain on TS repo
      this.state.configFile = result.body!.configFileName as string | undefined

      if (this.state.configFile !== undefined) {
        const options = await getProjectCodeSettings(this.state.configFile)
        await client.execute("configure", {
          file: filePath,
          formatOptions: options,
        })
      }

      this.events.emit("opened")
    } else {
      this.state = undefined
    }
  }

  private dispose = async () => {
    this.subscriptions.dispose()
    await this.close()
  }

  private init = async () => {
    if (!this.state) return
    await this.state.client.execute("open", {
      file: this.state.filePath,
      fileContent: this.buffer.getText(),
    })

    await this.getErr()
  }

  private close = async () => {
    if (this.state) {
      const client = this.state.client
      const file = this.state.filePath
      await client.execute("close", {file})
      this.deps.clearFileErrors(file)
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

    if (this.state) {
      await this.state.client.execute("geterr", {
        files: Array.from(getOpenEditorsPaths()),
        delay: 100,
      })
    }

    this.events.emit("saved")
  }

  private onDidStopChanging = async ({changes}: {changes: Atom.TextChange[]}) => {
    // Don't update changedAt or emit any events if there are no actual changes or file isn't open
    if (changes.length === 0 || !this.state) return

    this.changedAtBatch = Date.now()

    const client = this.state.client

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

    await this.getErr()

    this.events.emit("changed")
  }
}
