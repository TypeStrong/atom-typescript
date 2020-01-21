import * as Atom from "atom"
import {flatten} from "lodash"
import {GetClientFunction, TSClient} from "../client"
import {handlePromise} from "../utils"
import {TBuildStatus} from "./atom/components/statusPanel"
import {getOpenEditorsPaths, getProjectConfig, isTypescriptFile} from "./atom/utils"

export interface Deps {
  getClient: GetClientFunction
  clearFileErrors: (filePath: string) => void
  reportBuildStatus: (status: TBuildStatus | undefined) => void
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

  private events = new Atom.Emitter<{opened: void}>()

  private state?: {
    client: TSClient
    filePath: string
    // Path to the project's tsconfig.json
    configFile: Atom.File | undefined
    subscriptions: Atom.CompositeDisposable
  }
  private compileOnSave: boolean = false

  private subscriptions = new Atom.CompositeDisposable()
  private openPromise: Promise<void>

  // tslint:disable-next-line:member-ordering
  public on = this.events.on.bind(this.events)

  private constructor(public buffer: Atom.TextBuffer, private deps: Deps) {
    this.subscriptions.add(
      buffer.onDidChangePath(this.onDidChangePath),
      buffer.onDidDestroy(this.dispose),
      buffer.onDidSave(() => {
        handlePromise(this.onDidSave())
      }),
      buffer.onDidStopChanging(({changes}) => {
        handlePromise(this.getErr({allFiles: false}))
        if (changes.length > 0) this.deps.reportBuildStatus(undefined)
      }),
      buffer.onDidChangeText(arg => {
        // NOTE: we don't need to worry about interleaving here,
        // because onDidChangeText pushes all changes at once
        handlePromise(this.onDidChangeText(arg))
      }),
    )

    this.openPromise = this.open(this.buffer.getPath())
  }

  public getPath() {
    return this.state && this.state.filePath
  }

  public getInfo() {
    if (!this.state) return
    return {
      clientVersion: this.state.client.version,
      tsConfigPath: this.state.configFile && this.state.configFile.getPath(),
    }
  }

  private async getErr({allFiles}: {allFiles: boolean}) {
    if (!this.state) return
    const files = allFiles ? Array.from(getOpenEditorsPaths()) : [this.state.filePath]
    await this.state.client.execute("geterr", {
      files,
      delay: 100,
    })
  }

  /** Throws! */
  private async compile() {
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

  private async doCompileOnSave() {
    if (!this.compileOnSave) return
    this.deps.reportBuildStatus(undefined)
    try {
      await this.compile()
      this.deps.reportBuildStatus({success: true})
    } catch (error) {
      const e = error as Error
      console.error("Save failed with error", e)
      this.deps.reportBuildStatus({success: false, message: e.message})
    }
  }

  private async open(filePath: string | undefined) {
    if (filePath !== undefined && isTypescriptFile(filePath)) {
      const client = await this.deps.getClient(filePath)

      this.state = {
        client,
        filePath,
        configFile: undefined,
        subscriptions: new Atom.CompositeDisposable(),
      }

      this.state.subscriptions.add(client.on("restarted", () => handlePromise(this.init())))

      await this.init()

      const result = await client.execute("projectInfo", {
        needFileNameList: false,
        file: filePath,
      })

      // TODO: wrong type here, complain on TS repo
      if ((result.body!.configFileName as string | undefined) !== undefined) {
        this.state.configFile = new Atom.File(result.body!.configFileName)
        await this.readConfigFile()
        this.state.subscriptions.add(
          this.state.configFile.onDidChange(() => handlePromise(this.readConfigFile())),
        )
      }

      this.events.emit("opened")
    } else {
      return this.close()
    }
  }

  private dispose = () => {
    this.subscriptions.dispose()
    handlePromise(this.close())
  }

  private async readConfigFile() {
    if (!this.state || !this.state.configFile) return
    const options = getProjectConfig(this.state.configFile.getPath())
    this.compileOnSave = options.compileOnSave
    await this.state.client.execute("configure", {
      file: this.state.filePath,
      formatOptions: options.formatCodeOptions,
    })
  }

  private init = async () => {
    if (!this.state) return
    await this.state.client.execute("open", {
      file: this.state.filePath,
      fileContent: this.buffer.getText(),
    })

    handlePromise(this.getErr({allFiles: false}))
  }

  private close = async () => {
    await this.openPromise
    if (this.state) {
      const client = this.state.client
      const file = this.state.filePath
      this.deps.clearFileErrors(file)
      this.state.subscriptions.dispose()
      this.state = undefined
      await client.execute("close", {file})
    }
  }

  private onDidChangePath = (newPath: string) => {
    handlePromise(
      this.close().then(() => {
        this.openPromise = this.open(newPath)
      }),
    )
  }

  private onDidSave = async () => {
    await Promise.all([this.getErr({allFiles: true}), this.doCompileOnSave()])
  }

  private onDidChangeText = async ({changes}: {changes: ReadonlyArray<Atom.TextChange>}) => {
    // If there are no actual changes, or the file isn't open, we have nothing to do
    if (changes.length === 0 || !this.state) return

    const {client, filePath} = this.state

    // NOTE: this might look somewhat weird until we realize that
    // awaiting on each "change" command may lead to arbitrary
    // interleaving, while pushing them all at once guarantees
    // that all subsequent "change" commands will be sequenced after
    // the ones we pushed
    await Promise.all(
      changes.reduceRight<Array<Promise<void>>>((acc, {oldRange, newText}) => {
        acc.push(
          client.execute("change", {
            file: filePath,
            line: oldRange.start.row + 1,
            offset: oldRange.start.column + 1,
            endLine: oldRange.end.row + 1,
            endOffset: oldRange.end.column + 1,
            insertString: newText,
          }),
        )
        return acc
      }, []),
    )
  }
}
