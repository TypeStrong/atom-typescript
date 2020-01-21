import {CompositeDisposable, Emitter, File} from "atom"
import {Diagnostic, UpdateOpenRequestArgs} from "typescript/lib/protocol"
import {GetClientFunction, TSClient} from "../client"
import {EventTypes} from "../client/clientResolver"
import {handlePromise} from "../utils"
import {getOpenEditorsPaths, isTypescriptFile} from "./atom/utils"
import {findNodeAt, prepareNavTree} from "./atom/views/outline/navTreeUtils"
import {NavigationTreeViewModel} from "./atom/views/outline/semanticViewModel"

interface FileMap {
  source: File
  target: string | undefined
  disp: CompositeDisposable
}

interface TriggerMap {
  client: TSClient
  file: string
  references: string[]
}

type FileEvents = "changed" | "renamed" | "deleted"

export class ChecklistResolver {
  private files = new Map<string, FileMap>()
  private errors = new Map<string, Set<string>>()
  private triggers = new Set<TriggerMap>()
  private subscriptions = new CompositeDisposable()
  private emitter = new Emitter<{}, EventTypes>()
  private isBusy = false

  // tslint:disable-next-line:member-ordering
  public on = this.emitter.on.bind(this.emitter)

  constructor(private getClient: GetClientFunction) {}

  public async checkErrorAt(file: string, startLine: number, endLine: number) {
    const client = await this.getClient(file)
    const navTreeRes = await client.execute("navtree", {file})
    const navTree = navTreeRes.body as NavigationTreeViewModel
    prepareNavTree(navTree)

    const node = findNodeAt(startLine, endLine, navTree)
    let references: string[] = []

    if (node && node.nameSpan) {
      const res = await client.execute("references", {file, ...node.nameSpan.start})
      references = res.body ? res.body.refs.map(ref => ref.file) : []
    }

    this.triggers.add({client, file, references})
    await this.checkErrors()
  }

  public async closeFile(filePath: string) {
    if (!this.files.has(filePath)) return
    const target = this.files.get(filePath)?.target
    const triggerFile = target !== undefined ? target : filePath
    await this.closeFiles(triggerFile, [filePath])
  }

  public revokeErrors(triggerFile: string) {
    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const errorFiles = Array.from(this.getErrorsAt(triggerFile))
    const files = errorFiles.filter(filePath => openedFiles.includes(filePath))
    this.errors.delete(triggerFile)
    handlePromise(this.getError(triggerFile, files))
    return errorFiles
  }

  public dispose() {
    this.files.clear()
    this.errors.clear()
    this.triggers.clear()
    this.emitter.dispose()
    this.subscriptions.dispose()
  }

  private async checkErrors() {
    if (!this.isBusy && this.triggers.size > 0) {
      this.isBusy = true
      const [triggerMap] = this.triggers
      await this.checkReferences(triggerMap)
      this.triggers.delete(triggerMap)
      this.isBusy = false
      await this.checkErrors()
    }
  }

  private async checkReferences({client, file, references}: TriggerMap) {
    const files = await this.makeList(file, references)
    for (const filePath of files) {
      const res = await client.execute("semanticDiagnosticsSync", {file: filePath})
      if (res.body) {
        this.emitter.emit("diagnostics", {
          filePath,
          type: "semanticDiag",
          serverPath: client.tsServerPath,
          diagnostics: res.body as Diagnostic[],
        })
        this.setError(file, filePath, res.body.length !== 0)
      }
    }
    await this.clearList(file)
  }

  private async makeList(file: string, references: string[]) {
    const errors = this.getErrorsAt(file)
    const checkList = [...errors, ...references].reduce((acc: string[], cur: string) => {
      if (!acc.includes(cur) && isTypescriptFile(cur)) acc.push(cur)
      return acc
    }, [])

    await this.openFiles(file, checkList)
    return checkList
  }

  private async clearList(file: string) {
    if (this.files.size > 0) await this.closeFiles(file)
  }

  private setError(triggerFile: string, filePath: string, hasError: boolean) {
    const errorFiles = this.getErrorsAt(triggerFile)
    switch (hasError) {
      case true:
        if (!errorFiles.has(filePath)) errorFiles.add(filePath)
        break
      case false:
        if (errorFiles.has(filePath)) errorFiles.delete(filePath)
        break
    }
  }

  private async getError(triggerFile: string, files: string[]) {
    const client = await this.getClient(triggerFile)
    await client.execute("geterr", {files, delay: 100})
  }

  private getErrorsAt(triggerFile: string) {
    let errorFiles = this.errors.get(triggerFile)
    if (!errorFiles) {
      errorFiles = new Set()
      this.errors.set(triggerFile, errorFiles)
    }
    return errorFiles
  }

  private async openFiles(triggerFile: string, checkList: string[]) {
    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const openFiles = checkList
      .filter(filePath => {
        if (triggerFile !== filePath && !openedFiles.includes(filePath)) {
          return this.addFile(filePath, triggerFile)
        }
        return false
      })
      .map(file => ({file}))

    await this.updateOpen(triggerFile, {openFiles})
  }

  private async closeFiles(triggerFile: string, checkList?: string[]) {
    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const closedFiles = (checkList === undefined
      ? Array.from(this.files.keys())
      : checkList
    ).filter(filePath => {
      if (!openedFiles.includes(filePath)) {
        return this.removeFile(filePath)
      }
      return false
    })

    await this.updateOpen(triggerFile, {closedFiles})
  }

  private async updateOpen(filePath: string, options: UpdateOpenRequestArgs) {
    const {openFiles, closedFiles} = options
    if ((closedFiles && closedFiles.length === 0) || (openFiles && openFiles.length === 0)) return
    const client = await this.getClient(filePath)
    await client.execute("updateOpen", options)
  }

  private addFile(filePath: string, target: string) {
    if (this.files.has(filePath)) return false

    const source = new File(filePath)
    if (!source.existsSync()) return false

    const disp = new CompositeDisposable()
    const fileMap = {target, source, disp}
    disp.add(
      source.onDidChange(this.trackHandler(target, filePath, "changed")),
      source.onDidDelete(this.trackHandler(target, filePath, "deleted")),
      source.onDidRename(this.trackHandler(target, filePath, "renamed")),
    )
    this.files.set(filePath, fileMap)
    this.subscriptions.add(disp)
    return true
  }

  private removeFile(filePath: string) {
    const file = this.files.get(filePath)
    if (!file) return false

    file.disp.dispose()
    this.files.delete(filePath)
    this.subscriptions.remove(file.disp)
    return true
  }

  private trackHandler = (triggerFile: string, filePath: string, type: FileEvents) => () => {
    switch (type) {
      case "deleted":
        handlePromise(this.openFiles(triggerFile, [filePath]))
        break
      case "changed":
      case "renamed":
        handlePromise(
          this.closeFiles(triggerFile, [filePath]).then(() =>
            this.openFiles(triggerFile, [filePath]),
          ),
        )
        break
    }
  }

  private getOpenedFilesFromEditor(filePath: string) {
    const [projectRootPath] = atom.project.relativizePath(filePath)
    if (projectRootPath === null) return []
    return Array.from(getOpenEditorsPaths()).reduce((acc: string[], cur: string) => {
      if (!acc.includes(cur) && cur.includes(projectRootPath)) acc.push(cur)
      return acc
    }, [])
  }
}
