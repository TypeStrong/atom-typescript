import {CompositeDisposable, File} from "atom" // Emitter
import {UpdateOpenRequestArgs} from "typescript/lib/protocol"
import {DiagnosticsPayload, GetClientFunction} from "../../client"
import {handlePromise} from "../../utils"
import {ErrorPusher} from "../errorPusher"
import {getOpenEditorsPaths, isTypescriptFile} from "./utils"

type FileEventTypes = "changed" | "renamed" | "deleted"

export class FileTracker {
  private files = new Map<string, File>()
  private errors = new Map<string, Set<string>>()
  private subscriptions = new CompositeDisposable()

  constructor(
    private getClient: GetClientFunction,
    private errorPusher: ErrorPusher,
  ) {}

  public async getCheckList(triggerFile: string, references: string[]) {
    const errors = Array.from(this.getErrorsAt(triggerFile))
    const checkList = [triggerFile, ...errors, ...references].reduce((acc: string[], cur: string) => {
      if (!acc.includes(cur) && isTypescriptFile(cur)) acc.push(cur)
      return acc
    }, [])

    await this.openFiles(triggerFile, checkList)

    return checkList
  }

  public async clearCheckList(file: string) {
    if (this.files.size > 0) {
      await this.closeFiles(file)
      // this.files.clear()
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
    const openFiles = checkList.filter(filePath => {
      if (!openedFiles.includes(filePath) && !this.files.has(filePath)) {
        const file = this.getFile(filePath)
        if (file) return true
      }
      return false
    }).map(file => ({file, projectRootPath}))

    if (openFiles.length > 0) {
      await this.updateOpen(triggerFile, {openFiles})
    }
  }

  private async closeFiles(triggerFile: string) {
    const openedFiles = this.getOpenedFilesFromEditor(triggerFile)
    const closedFiles = Array.from(this.files.keys())
      .filter(filePath => !openedFiles.includes(filePath))

    if (closedFiles.length > 0) {
      await this.updateOpen(triggerFile, {closedFiles})
    }
  }

  private async open(filePath: string) {
    if (this.files.has(filePath)) return
    const file = this.getFile(filePath)
    if (file) await this.updateOpen(filePath, {openFiles: [{file: file.getPath()}]})
  }

  private async close(filePath: string) {
    if (!this.files.has(filePath)) return
    const file = this.getFile(filePath)
    if (file) {
      await this.updateOpen(filePath, {closedFiles: [filePath]})
      this.files.delete(filePath)
    }
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

    const newFile = new File(filePath)
    if (newFile.existsSync()) {
      this.files.set(filePath, newFile)

      this.subscriptions.add(
        newFile.onDidChange(this.trackHandler(filePath, "changed")),
        newFile.onDidDelete(this.trackHandler(filePath, "deleted")),
        newFile.onDidRename(this.trackHandler(filePath, "renamed")),
      )

      return newFile
    }
    return null
  }

  private trackHandler = (filePath: string, type: FileEventTypes) => () => {
    console.log("[IDE.FilerTracker.Event]", type, filePath)
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
