import {CompositeDisposable, File} from "atom" // Emitter
import {UpdateOpenRequestArgs} from "typescript/lib/protocol"
import {DiagnosticsPayload, GetClientFunction} from "../../client"
import {handlePromise} from "../../utils"
import {ErrorPusher} from "../errorPusher"
import {ReportBusyWhile} from "../pluginManager"
import {getOpenEditorsPaths, isTypescriptFile} from "./utils"

export class FileTracker {
  private files = new Map<string, {disp: CompositeDisposable; src: File}>()
  private errors = new Map<string, Set<string>>()
  private subscriptions = new CompositeDisposable()

  constructor(
    private reportBusyWhile: ReportBusyWhile,
    private getClient: GetClientFunction,
    private errorPusher: ErrorPusher,
  ) {}

  public async makeCheckList(triggerFile: string, references: string[]) {
    const errors = Array.from(this.getErrorsAt(triggerFile))
    const checkList = [triggerFile, ...errors, ...references].reduce(
      (acc: string[], cur: string) => {
        if (!acc.includes(cur) && isTypescriptFile(cur)) acc.push(cur)
        return acc
      },
      [],
    )
    await this.reportBusyWhile("Creating Check List", () => this.openFiles(triggerFile, checkList))
    return checkList
  }

  public async clearCheckList(file: string) {
    if (this.files.size > 0) {
      await this.closeFiles(file)
      this.files.clear()
    }
  }

  public async setError(triggerFile: string, {type, filePath, diagnostics}: DiagnosticsPayload) {
    const errorFiles = this.getErrorsAt(triggerFile)
    if (!errorFiles.has(filePath)) {
      errorFiles.add(filePath)
    }
    this.errorPusher.setErrors(type, filePath, diagnostics)
  }

  public dispose() {
    this.files.clear()
    this.errors.clear()
    this.subscriptions.dispose()
  }

  private async openFiles(triggerFile: string, checkList: string[]) {
    const projectRootPath = this.getProjectRootPath(triggerFile)
    if (projectRootPath === null) return []

    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const openFiles = checkList
      .filter(filePath => !openedFiles.includes(filePath) && !this.files.has(filePath))
      .map(filePath => this.getFile(filePath).src.getPath())
      .map(file => ({file, projectRootPath}))

    if (openFiles.length > 0) {
      await this.updateOpen(triggerFile, {openFiles})
    }
  }

  private async closeFiles(triggerFile: string) {
    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const closedFiles = Array.from(this.files.keys())
      .filter(filePath => !openedFiles.includes(filePath))
      .map(filePath => this.removeFile(filePath))

    if (closedFiles.length > 0) {
      await this.updateOpen(triggerFile, {closedFiles})
    }
  }

  private async open(filePath: string) {
    if (this.files.has(filePath)) return
    const openedFiles = this.getOpenedFilesFromEditor(filePath)
    if (!openedFiles.includes(filePath)) {
      return await this.updateOpen(filePath, {openFiles: [{file: filePath}]})
    }
    this.removeFile(filePath)
  }

  private async close(filePath: string) {
    if (!this.files.has(filePath)) return
    const openedFiles = this.getOpenedFilesFromEditor(filePath)
    if (!openedFiles.includes(filePath)) {
      await this.updateOpen(filePath, {closedFiles: [filePath]})
    }
    this.removeFile(filePath)
  }

  private async updateOpen(filePath: string, options: UpdateOpenRequestArgs) {
    const client = await this.getClient(filePath)
    await client.execute("updateOpen", options)
  }

  private getOpenedFilesFromEditor(filePath: string) {
    const projectRootPath = this.getProjectRootPath(filePath)
    if (projectRootPath === null) return []
    return Array.from(getOpenEditorsPaths()).reduce((acc: string[], cur: string) => {
      if (!acc.includes(cur) && cur.includes(projectRootPath)) acc.push(cur)
      return acc
    }, [])
  }

  private getErrorsAt(triggerFile: string) {
    let errorFiles = this.errors.get(triggerFile)
    if (!errorFiles) {
      errorFiles = new Set()
      this.errors.set(triggerFile, errorFiles)
    }
    return errorFiles
  }

  private getFile(filePath: string) {
    const file = this.files.get(filePath)
    if (file) return file

    const src = new File(filePath)
    const disp = new CompositeDisposable()
    const fileMap = {disp, src}
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
    switch (type) {
      case "deleted":
        handlePromise(this.close(filePath))
        break
      case "changed":
      case "renamed":
        handlePromise(this.close(filePath).then(() => this.open(filePath)))
        break
    }
  }

  private getProjectRootPath(filePath: string) {
    const [projectRootPath] = atom.project.relativizePath(filePath)
    return projectRootPath
  }
}
