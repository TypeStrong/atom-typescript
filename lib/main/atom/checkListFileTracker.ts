import {CompositeDisposable, File} from "atom" // Emitter
import {UpdateOpenRequestArgs} from "typescript/lib/protocol"
import {GetClientFunction} from "../../client"
import {DiagnosticTypes} from "../../client/clientResolver"
import {handlePromise} from "../../utils"
import {ReportBusyWhile} from "../pluginManager"
import {getOpenEditorsPaths, isTypescriptFile} from "./utils"

export class CheckListFileTracker {
  private files = new Map<string, {disp: CompositeDisposable; src: File}>()
  private errors = new Map<string, Set<string>>()
  private subscriptions = new CompositeDisposable()
  private completeResolver = {resolve: () => {}}

  constructor(private reportBusyWhile: ReportBusyWhile, private getClient: GetClientFunction) {}

  public has(filePath: string) {
    return this.files.has(filePath)
  }

  public async makeList(triggerFile: string, references: string[]) {
    const errors = Array.from(this.getErrorsAt(triggerFile))
    const checkList = [triggerFile, ...errors, ...references].reduce(
      (acc: string[], cur: string) => {
        if (!acc.includes(cur) && isTypescriptFile(cur)) acc.push(cur)
        return acc
      },
      [],
    )
    handlePromise(this.waitComplete())
    await this.openFiles(triggerFile, checkList)
    return checkList
  }

  public async clearList(file: string) {
    if (this.files.size > 0) {
      await this.closeFiles(file)
      this.files.clear()
    }
    this.completeResolver.resolve()
  }

  public setError(prefix: DiagnosticTypes, filePath: string, hasError: boolean) {
    if (prefix !== "semanticDiag") return

    const triggerFile = this.getTriggerFile()
    const errorFiles = this.getErrorsAt(triggerFile !== undefined ? triggerFile : filePath)

    if (hasError && !errorFiles.has(filePath)) {
      errorFiles.add(filePath)
    }

    if (!hasError && errorFiles.has(filePath)) {
      errorFiles.delete(filePath)
    }
  }

  public dispose() {
    this.files.clear()
    this.errors.clear()
    this.subscriptions.dispose()
  }

  private waitComplete() {
    const promise = new Promise(resolve => {
      this.completeResolver.resolve = resolve
    })
    return this.reportBusyWhile("Checking Related Files", () => promise)
  }

  private async openFiles(triggerFile: string, checkList: string[]) {
    const projectRootPath = this.getProjectRootPath(triggerFile)
    if (projectRootPath === null) return

    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const openFiles = checkList
      .filter(filePath => !openedFiles.includes(filePath) && !this.files.has(filePath))
      .map(filePath => this.getFile(filePath, triggerFile).src.getPath())
      .map(file => ({file, projectRootPath}))

    if (openFiles.length > 0) await this.updateOpen(triggerFile, {openFiles})
  }

  private async closeFiles(triggerFile: string, checkList?: string[]) {
    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const closedFiles = (checkList === undefined ? Array.from(this.files.keys()) : checkList)
      .filter(filePath => !openedFiles.includes(filePath))
      .map(filePath => this.removeFile(filePath))

    if (closedFiles.length > 0) await this.updateOpen(triggerFile, {closedFiles})
  }

  private async updateOpen(filePath: string, options: UpdateOpenRequestArgs) {
    const client = await this.getClient(filePath)
    await client.execute("updateOpen", options)
  }

  private getErrorsAt(triggerFile: string) {
    let errorFiles = this.errors.get(triggerFile)
    if (!errorFiles) {
      errorFiles = new Set()
      this.errors.set(triggerFile, errorFiles)
    }
    return errorFiles
  }

  private getFile(filePath: string, triggerFile = this.getTriggerFile()) {
    const file = this.files.get(filePath)
    if (file) return file

    const src = new File(filePath)
    const disp = new CompositeDisposable()
    const fileMap = {triggerFile, disp, src}
    disp.add(
      src.onDidChange(this.trackHandler(filePath, "changed")),
      src.onDidDelete(this.trackHandler(filePath, "deleted")),
      src.onDidRename(this.trackHandler(filePath, "renamed")),
    )
    this.files.set(filePath, fileMap)
    this.subscriptions.add(disp)
    return fileMap
  }

  private removeFile(filePath: string) {
    const file = this.getFile(filePath)
    this.files.delete(filePath)
    this.subscriptions.remove(file.disp)
    return filePath
  }

  private trackHandler = (filePath: string, type: "changed" | "renamed" | "deleted") => () => {
    const triggerFile = this.getTriggerFile()
    if (triggerFile === undefined) return

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

  private getTriggerFile() {
    const ed = atom.workspace.getActiveTextEditor()
    if (ed) return ed.getPath()
  }

  private getProjectRootPath(filePath: string) {
    const [projectRootPath] = atom.project.relativizePath(filePath)
    return projectRootPath
  }
}
