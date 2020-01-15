import {CompositeDisposable, Emitter, File} from "atom"
import {Diagnostic, UpdateOpenRequestArgs} from "typescript/lib/protocol"
import {GetClientFunction} from "../../client"
import {EventTypes} from "../../client/clientResolver"
import {handlePromise} from "../../utils"
import {getOpenEditorsPaths, isTypescriptFile} from "./utils"
import {findNodeAt, prepareNavTree} from "./views/outline/navTreeUtils"
import {NavigationTreeViewModel} from "./views/outline/semanticViewModel"

interface FileMap {
  source: File
  target: string | undefined
  disp: CompositeDisposable
}

type FileEvents = "changed" | "renamed" | "deleted"

export class ChecklistResolver {
  private files = new Map<string, FileMap>()
  private errors = new Map<string, Set<string>>()
  private subscriptions = new CompositeDisposable()
  private emitter = new Emitter<{}, EventTypes>()
  private isInProgress = false

  // tslint:disable-next-line:member-ordering
  public on = this.emitter.on.bind(this.emitter)

  constructor(private getClient: GetClientFunction) {}

  public async check(file: string, startLine: number, endLine: number) {
    if (this.isInProgress) return

    const [root] = atom.project.relativizePath(file)
    if (root === null) return

    this.isInProgress = true

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

  public async setFile(filePath: string, isOpen: boolean) {
    if (!this.files.has(filePath)) return
    const target = this.files.get(filePath)?.target
    const triggerFile = target !== undefined ? target : filePath

    switch (isOpen) {
      // execute before "open" command
      case true:
        await this.closeFiles(triggerFile, [filePath])
        break
      // execute after "close" command
      case false:
        this.removeFile(filePath)
        await this.openFiles(triggerFile, [filePath])
        break
    }
  }

  public clearErrors(triggerFile: string) {
    const errorFiles = this.getErrorsAt(triggerFile)
    this.errors.delete(triggerFile)
    return errorFiles
  }

  public dispose() {
    this.files.clear()
    this.errors.clear()
    this.emitter.dispose()
    this.subscriptions.dispose()
  }

  private async makeList(triggerFile: string, references: string[]) {
    const errors = this.getErrorsAt(triggerFile)
    const checkList = [...errors, ...references].reduce((acc: string[], cur: string) => {
      if (!acc.includes(cur) && isTypescriptFile(cur)) acc.push(cur)
      return acc
    }, [])

    await this.openFiles(triggerFile, checkList)
    return checkList
  }

  private async clearList(file: string) {
    if (this.files.size > 0) await this.closeFiles(file)
    this.isInProgress = false
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

  private getErrorsAt(triggerFile: string) {
    let errorFiles = this.errors.get(triggerFile)
    if (!errorFiles) {
      errorFiles = new Set()
      this.errors.set(triggerFile, errorFiles)
    }
    return errorFiles
  }

  private async openFiles(triggerFile: string, checkList: string[]) {
    const projectRootPath = this.getProjectRootPath(triggerFile)
    if (projectRootPath === null) return

    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const openFiles = checkList
      .filter(
        filePath =>
          triggerFile !== filePath && !openedFiles.includes(filePath) && !this.files.has(filePath),
      )
      .map(file => ({file, projectRootPath}))

    if (openFiles.length > 0) {
      await this.updateOpen(triggerFile, {openFiles})
      openFiles.forEach(({file}) => this.addFile(file, triggerFile))
    }
  }

  private async closeFiles(triggerFile: string, checkList?: string[]) {
    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const closedFiles = (checkList === undefined
      ? Array.from(this.files.keys())
      : checkList
    ).filter(filePath => !openedFiles.includes(filePath))

    if (closedFiles.length > 0) {
      await this.updateOpen(triggerFile, {closedFiles})
      closedFiles.forEach(filePath => this.removeFile(filePath))
    }
  }

  private async updateOpen(filePath: string, options: UpdateOpenRequestArgs) {
    const client = await this.getClient(filePath)
    await client.execute("updateOpen", options)
  }

  private addFile(filePath: string, target: string) {
    if (this.files.has(filePath)) {
      return
    }
    const disp = new CompositeDisposable()
    const source = new File(filePath)
    const fileMap = {target, source, disp}
    disp.add(
      source.onDidChange(this.trackHandler(target, filePath, "changed")),
      source.onDidDelete(this.trackHandler(target, filePath, "deleted")),
      source.onDidRename(this.trackHandler(target, filePath, "renamed")),
    )
    this.files.set(filePath, fileMap)
    this.subscriptions.add(disp)
    return fileMap
  }

  private removeFile(filePath: string) {
    const file = this.files.get(filePath)
    if (!file) return
    this.files.delete(filePath)
    this.subscriptions.remove(file.disp)
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
    const projectRootPath = this.getProjectRootPath(filePath)
    if (projectRootPath === null) return []
    return Array.from(getOpenEditorsPaths()).reduce((acc: string[], cur: string) => {
      if (!acc.includes(cur) && cur.includes(projectRootPath)) acc.push(cur)
      return acc
    }, [])
  }

  private getProjectRootPath(filePath: string) {
    const [projectRootPath] = atom.project.relativizePath(filePath)
    return projectRootPath
  }
}
