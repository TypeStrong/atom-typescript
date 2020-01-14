import {CompositeDisposable, File} from "atom" // Emitter
import {UpdateOpenRequestArgs} from "typescript/lib/protocol"
import {GetClientFunction} from "../../client"
import {handlePromise} from "../../utils"
import {getOpenEditorsPaths, isTypescriptFile} from "./utils"

interface FileMap {
  src: File
  triggerFile: string | undefined
  disp: CompositeDisposable
}

export class CheckListFileTracker {
  private files = new Map<string, FileMap>()
  private errors = new Map<string, Set<string>>()
  private subscriptions = new CompositeDisposable()
  private busyPromise = new Promise(resolve => resolve())
  private busyPromiseResolver: () => void

  constructor(private getClient: GetClientFunction) {
    this.busyPromiseResolver = () => {}
  }

  public async makeList(triggerFile: string, references: string[]) {
    await this.busyPromise
    const errors = this.getErrorsAt(triggerFile)
    const checkList = [triggerFile, ...errors, ...references].reduce(
      (acc: string[], cur: string) => {
        if (!acc.includes(cur) && isTypescriptFile(cur)) acc.push(cur)
        return acc
      },
      [],
    )
    this.busyPromise = new Promise(resolve => {
      this.busyPromiseResolver = resolve
    })
    await this.openFiles(triggerFile, checkList)
    return checkList
  }

  public async clearList(file: string) {
    if (this.files.size > 0) await this.closeFiles(file)
    this.busyPromiseResolver()
  }

  public async setFile(filePath: string, isOpen: boolean) {
    if (!this.files.has(filePath)) return
    const triggerFile = this.files.get(filePath)?.triggerFile
    const triggerFilePath = triggerFile !== undefined ? triggerFile : filePath

    switch (isOpen) {
      // execute before "open" command
      case true:
        await this.closeFiles(triggerFilePath, [filePath])
        break
      // execute after "close" command
      case false:
        this.removeFile(filePath)
        await this.openFiles(triggerFilePath, [filePath])
        break
    }
  }

  public setError(filePath: string, hasError: boolean) {
    const triggerFile = this.getTriggerFile()
    const errorFiles = this.getErrorsAt(triggerFile !== undefined ? triggerFile : filePath)

    switch (hasError) {
      case true:
        if (!errorFiles.has(filePath)) errorFiles.add(filePath)
        break
      case false:
        if (errorFiles.has(filePath)) errorFiles.delete(filePath)
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
    this.subscriptions.dispose()
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
      .filter(filePath => !openedFiles.includes(filePath) && !this.files.has(filePath))
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

  private addFile(filePath: string, triggerFile = this.getTriggerFile()) {
    if (this.files.has(filePath)) {
      return
    }
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
    const file = this.files.get(filePath)
    if (file === undefined) return
    this.files.delete(filePath)
    this.subscriptions.remove(file.disp)
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
